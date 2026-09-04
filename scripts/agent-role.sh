#!/usr/bin/env bash
# Read-only helper for the portable EFS role roster.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
AGENTS_DIR="$VAULT_ROOT/Agents"
AGENTS_PHYSICAL="$(cd "$AGENTS_DIR" 2>/dev/null && pwd -P || true)"
ROSTER="$AGENTS_DIR/README.md"
LAUNCH_CONTRACT="$AGENTS_DIR/launch.md"

ROLE_IDS=()
ROLE_NAMES=()
ROLE_BRIEFS=()
ROUTE_KEYS=()
ROUTE_ROLE_INDEX=()
ROLE_COUNT=0
ROUTE_COUNT=0
INVALID=0

usage() {
  echo "usage: $(basename "$0") {list|check|launch ROLE_OR_EXACT_ALIAS}" >&2
  exit 2
}

trim() {
  printf '%s' "$1" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//'
}

lowercase() {
  LC_ALL=C printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

invalid() {
  echo "invalid role registry: $1" >&2
  INVALID=1
}

add_route_key() {
  local raw="$1"
  local role_index="$2"
  local key existing_index i
  key="$(lowercase "$(trim "$raw")")"
  if [[ -z "$key" ]]; then
    invalid "empty ID, name, or alias"
    return
  fi
  i=0
  while [[ $i -lt ${#ROUTE_KEYS[@]} ]]; do
    if [[ "${ROUTE_KEYS[$i]}" == "$key" ]]; then
      existing_index="${ROUTE_ROLE_INDEX[$i]}"
      if [[ "$existing_index" != "$role_index" ]]; then
        invalid "ambiguous route '$raw'"
      fi
      return
    fi
    i=$((i + 1))
  done
  ROUTE_KEYS+=("$key")
  ROUTE_ROLE_INDEX+=("$role_index")
}

section_has_content() {
  local brief="$1"
  local heading="$2"
  awk -v wanted="## $heading" '
    $0 == wanted { seen = 1; next }
    seen && /^## / { exit }
    seen && $0 !~ /^[[:space:]]*$/ { content = 1 }
    END { exit content ? 0 : 1 }
  ' "$brief"
}

check_brief() {
  local id="$1"
  local brief="$2"
  local heading
  local headings
  if [[ "$id" == "pm" ]]; then
    headings="Role frame|What to scan / ignore|Autonomy boundaries"
  else
    headings="Mission|Owns|Does not own|Deliverables|Collaborators|Decisions|Start here|Working style"
  fi
  local old_ifs="$IFS"
  IFS='|'
  read -r -a required_headings <<< "$headings"
  IFS="$old_ifs"
  for heading in "${required_headings[@]}"; do
    if ! section_has_content "$brief" "$heading"; then
      invalid "brief for '$id' lacks a nonempty '$heading' section"
    fi
  done
}

check_brief_path() {
  local id="$1"
  local link="$2"
  local target rel candidate candidate_dir candidate_physical
  target="$(printf '%s\n' "$link" | sed -n 's/^\[[^]]*\](\([^)]*\))$/\1/p')"
  if [[ -z "$target" ]]; then
    invalid "brief for '$id' is not one Markdown link"
    return
  fi
  case "$target" in
    ./*.md) ;;
    *)
      invalid "brief for '$id' must be an Agents-relative Markdown path"
      return
      ;;
  esac
  rel="${target#./}"
  case "/$rel/" in
    */../*)
      invalid "brief for '$id' escapes Agents"
      return
      ;;
  esac
  candidate="$AGENTS_DIR/$rel"
  if [[ -L "$candidate" ]]; then
    invalid "brief for '$id' must not be a symlink"
    return
  fi
  if [[ ! -f "$candidate" ]]; then
    invalid "brief for '$id' is not a regular file"
    return
  fi
  candidate_dir="$(cd "$(dirname "$candidate")" 2>/dev/null && pwd -P || true)"
  candidate_physical="$candidate_dir/$(basename "$candidate")"
  case "$candidate_physical" in
    "$AGENTS_PHYSICAL"/*) ;;
    *)
      invalid "brief for '$id' resolves outside Agents"
      return
      ;;
  esac
  ROLE_BRIEFS+=("$rel")
  check_brief "$id" "$candidate"
}

validate_registry() {
  local line state start_markers end_markers header_seen separator_seen
  local body fields id name aliases brief use alias old_ifs role_index
  local -a alias_parts

  ROLE_IDS=()
  ROLE_NAMES=()
  ROLE_BRIEFS=()
  ROUTE_KEYS=()
  ROUTE_ROLE_INDEX=()
  ROLE_COUNT=0
  ROUTE_COUNT=0
  INVALID=0
  state=0
  start_markers=0
  end_markers=0
  header_seen=0
  separator_seen=0

  if [[ -z "$AGENTS_PHYSICAL" || ! -f "$ROSTER" ]]; then
    echo "error: Agents/README.md not found from $VAULT_ROOT" >&2
    return 2
  fi
  if [[ ! -f "$LAUNCH_CONTRACT" ]]; then
    invalid "Agents/launch.md is missing"
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "<!-- role-registry:start -->" ]]; then
      start_markers=$((start_markers + 1))
      if [[ $state -ne 0 ]]; then
        invalid "role-registry start marker is misplaced"
      fi
      state=1
      continue
    fi
    if [[ "$line" == "<!-- role-registry:end -->" ]]; then
      end_markers=$((end_markers + 1))
      if [[ $state -ne 1 ]]; then
        invalid "role-registry end marker is misplaced"
      fi
      state=2
      continue
    fi
    [[ $state -eq 1 ]] || continue
    [[ -z "$(trim "$line")" ]] && continue

    if [[ $header_seen -eq 0 ]]; then
      if [[ "$line" != "| Role ID | Name | Aliases | Brief | Use |" ]]; then
        invalid "role-registry header must be Role ID | Name | Aliases | Brief | Use"
      fi
      header_seen=1
      continue
    fi
    if [[ $separator_seen -eq 0 ]]; then
      if [[ "$line" != "|---|---|---|---|---|" ]]; then
        invalid "role-registry separator is malformed"
      fi
      separator_seen=1
      continue
    fi

    case "$line" in
      \|*\|) ;;
      *)
        invalid "role-registry row is malformed"
        continue
        ;;
    esac
    body="${line#|}"
    body="${body%|}"
    fields="$(printf '%s\n' "$body" | awk -F'|' '{print NF}')"
    if [[ "$fields" != "5" ]]; then
      invalid "role-registry row has the wrong number of columns"
      continue
    fi
    old_ifs="$IFS"
    IFS='|'
    read -r id name aliases brief use <<< "$body"
    IFS="$old_ifs"
    id="$(trim "$id")"
    name="$(trim "$name")"
    aliases="$(trim "$aliases")"
    brief="$(trim "$brief")"
    use="$(trim "$use")"
    if [[ ! "$id" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
      invalid "role ID '$id' is not lowercase kebab-case"
    fi
    if [[ -z "$name" || -z "$aliases" || -z "$brief" || -z "$use" ]]; then
      invalid "role '$id' has an empty required column"
    fi
    case "$aliases" in
      \;*|*\;|*\;\;*) invalid "role '$id' has an empty alias" ;;
    esac
    case "$use" in
      established|on-demand) ;;
      *) invalid "role '$id' has invalid Use '$use'" ;;
    esac

    role_index=${#ROLE_IDS[@]}
    ROLE_IDS+=("$id")
    ROLE_NAMES+=("$name")
    add_route_key "$id" "$role_index"
    add_route_key "$name" "$role_index"
    old_ifs="$IFS"
    IFS=';'
    read -r -a alias_parts <<< "$aliases"
    IFS="$old_ifs"
    for alias in "${alias_parts[@]}"; do
      alias="$(trim "$alias")"
      add_route_key "$alias" "$role_index"
    done
    check_brief_path "$id" "$brief"
  done < "$ROSTER"

  if [[ $start_markers -ne 1 || $end_markers -ne 1 || $state -ne 2 ]]; then
    invalid "role-registry markers are missing or unbalanced"
  fi
  if [[ $header_seen -eq 0 || $separator_seen -eq 0 ]]; then
    invalid "role-registry table has no valid header and separator"
  fi
  if [[ ${#ROLE_IDS[@]} -eq 0 ]]; then
    invalid "role-registry has no roles"
  fi
  ROLE_COUNT=${#ROLE_IDS[@]}
  ROUTE_COUNT=${#ROUTE_KEYS[@]}
  [[ $INVALID -eq 0 ]]
}

find_role_index() {
  local requested key i
  requested="$(trim "$1")"
  key="$(lowercase "$requested")"
  i=0
  while [[ $i -lt ${#ROUTE_KEYS[@]} ]]; do
    if [[ "${ROUTE_KEYS[$i]}" == "$key" ]]; then
      printf '%s\n' "${ROUTE_ROLE_INDEX[$i]}"
      return 0
    fi
    i=$((i + 1))
  done
  return 1
}

main() {
  local command="${1:-}"
  local index requested i validation_status
  case "$command" in
    list|check)
      [[ $# -eq 1 ]] || usage
      ;;
    launch)
      [[ $# -eq 2 && -n "$(trim "$2")" ]] || usage
      ;;
    *) usage ;;
  esac

  validation_status=0
  validate_registry || validation_status=$?
  if [[ $validation_status -ne 0 ]]; then
    exit "$validation_status"
  fi
  case "$command" in
    list)
      i=0
      while [[ $i -lt $ROLE_COUNT ]]; do
        printf '%s\t%s\tAgents/%s\n' "${ROLE_IDS[$i]}" "${ROLE_NAMES[$i]}" "${ROLE_BRIEFS[$i]}"
        i=$((i + 1))
      done
      ;;
    check)
      echo "$ROLE_COUNT role(s) checked; $ROUTE_COUNT routing key(s) validated."
      echo "Limits: this checker does not prove semantics, locks, permission enforcement, runtime support, or all project links."
      ;;
    launch)
      requested="$(trim "$2")"
      if ! index="$(find_role_index "$requested")"; then
        echo "unknown role: $requested" >&2
        exit 1
      fi
      cat <<EOF
Role ID: ${ROLE_IDS[$index]}
Role brief: $AGENTS_DIR/${ROLE_BRIEFS[$index]}
Launch contract: $LAUNCH_CONTRACT
Planning checkout on this machine: $VAULT_ROOT

Work as ${ROLE_IDS[$index]} on [objective and acceptance criteria; or unassigned]. In the planning checkout on this machine at $VAULT_ROOT, read AGENTS.md, Agents/README.md, Agents/launch.md, and the selected brief at Agents/${ROLE_BRIEFS[$index]}. Read the assigned code repository's instructions if applicable. For another machine, obtain the assigned branch and commit/source revision from the task or handoff; the filesystem location above identifies only this checkout. Start from [task/card/handoff reference, or fresh start]. Confirm your role, unique session label, scope, acceptance owner, source revisions and visibility before work. Read only the relevant current maps/inboxes/rulings. Preserve other writers' changes. If no task is assigned, orient read-only and report readiness; do not start a new task. Resume from evidence, not assumed chat memory.
EOF
      ;;
  esac
}

main "$@"
