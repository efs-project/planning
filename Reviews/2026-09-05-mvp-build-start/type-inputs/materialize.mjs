import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { encodeBlob, encodeGroup, derive } from './encoder.mjs';
import { parseGroup } from './parser.mjs';
const root = new URL('../../../', import.meta.url);
const inputUrl = new URL('./inputs.v1.json', import.meta.url);
const order = [
    ['ObjectGenesis/1', 'ResolutionPlan/1', 'ByteDigest/1', 'ChunkTree/1', 'Locator/1', 'RepresentationBinding/1'],
    ['BindingSet/1', 'BindingTombstone/1', 'Withdrawal/1'],
    ['DirectoryEntry/1', 'DirectoryWhiteout/1', 'FileRevision/1', 'PublicFilesMountConfig/1', 'MountDescriptor/1', 'FilesRouteConfig/1'],
    ['MvpC0BootstrapSeal/1']
];
const sha = b => createHash('sha256').update(b).digest('hex');
// Upper bound on structurally legal bodies, before contextual profile rules.
function maxBody(f) {
    if (f.kind === 'BOOL')
        return 1;
    if (['UINT', 'INT', 'BYTES_FIXED'].includes(f.kind))
        return f.width;
    if (['REF', 'PRINCIPAL'].includes(f.kind))
        return 32;
    if (f.kind === 'OCCREF')
        return 34;
    if (f.kind === 'DIGEST')
        return 68; // Global MC/1 allows SHA-512, content profile narrows it.
    if (['BYTES', 'STRING'].includes(f.kind))
        return 2 + f.max;
    if (f.kind === 'OPTION')
        return 1 + maxBody(f.inner);
    if (f.kind === 'ARRAY')
        return 2 + f.max * maxBody(f.inner);
    throw Error('body-size subset');
}
export function buildArtifacts(input = JSON.parse(readFileSync(inputUrl, 'utf8'))) {
    if (input.format !== 'efs-c0-temporary-type-inputs/1')
        throw Error('input format');
    for (const s of Object.values(input.sources)) {
        const digest = sha(readFileSync(new URL(s.path, root)));
        if (digest !== s.sha256)
            throw Error('source commitment mismatch: ' + s.path);
    }
    if (JSON.stringify(input.groups.map(g => g.map(s => s.name))) !== JSON.stringify(order))
        throw Error('ordered inventory mismatch');
    const qualification = Buffer.from(input.qualificationAscii, 'ascii');
    if (qualification.length > 32 || !qualification.length)
        throw Error('qualification');
    const qualifier = qualification.toString('hex').padEnd(64, '0');
    const known = new Map(), groups = [];
    for (const [groupIndex, group] of input.groups.entries()) {
        const descriptors = group.map(s => ({
            name: s.name, meaning: input.meaningTemplate.replace('{name}', s.name),
            specDigest: { algCode: 18, hex: input.sources[s.source].sha256 }, qualifier,
            fields: s.fields, roles: s.roles.map(r => {
                let expectedType = r.expectedType;
                if (expectedType.startsWith('TYPE:')) {
                    expectedType = known.get(expectedType.slice(5));
                    if (!expectedType)
                        throw Error('exact dependency closure missing: ' + r.expectedType);
                    expectedType = expectedType.slice(2);
                }
                return { ...r, expectedType };
            }), indexes: s.indexes, constraints: s.constraints
        }));
        const bytes = encodeGroup(descriptors);
        const ids = derive(bytes);
        const parsed = parseGroup(bytes, {
            knownTypes: [...known.values()],
            expectedIds: ids.ids
        });
        if (parsed.groupHash !== ids.groupHash || JSON.stringify(parsed.members) !== JSON.stringify(descriptors))
            throw Error('independent parser disagreement');
        const members = group.map((source, k) => {
            known.set(source.name, ids.ids[k]);
            return {
                memberIndex: k,
                name: source.name,
                source: { ...input.sources[source.source], section: source.section },
                shapeStatus: source.shapeStatus ?? 'SOURCE_FIELD_LAYOUT_WITH_TEMPORARY_METADATA_AND_DECLARED_CHOICES',
                profileRules: source.profileRules,
                temporaryTypeSchemaId: ids.ids[k],
                blobBytes: encodeBlob(descriptors[k]).length,
                maxStructuralBodyBytes: descriptors[k].fields.reduce((sum, f) => sum + maxBody(f), 0),
                descriptor: descriptors[k],
                blobHex: encodeBlob(descriptors[k]).toString('hex')
            };
        });
        groups.push({
            groupIndex: groupIndex + 1,
            temporaryGroupHash: ids.groupHash,
            groupBytes: bytes.length,
            recordBodyBytes: bytes.length + 2,
            remainingCarriageBytes: 8190 - bytes.length,
            groupHex: bytes.toString('hex'),
            recordBodyHex: bytes.length.toString(16).padStart(4, '0') + bytes.toString('hex'),
            members
        });
    }
    return {
        format: 'efs-c0-temporary-type-artifacts/1',
        sourceRevision: input.sourceRevision,
        inputSha256: sha(JSON.stringify(input)),
        sources: input.sources,
        temporaryChoices: input.temporaryChoices,
        admissionExecuted: false,
        fullC0: false,
        groups
    };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const result = buildArtifacts(), output = JSON.stringify(result, null, 2) + '\n', outUrl = new URL('./artifacts.v1.json', import.meta.url);
    if (process.argv.includes('--write'))
        writeFileSync(outUrl, output);
    else if (process.argv.includes('--check')) {
        if (readFileSync(outUrl, 'utf8') !== output)
            throw Error('artifact mismatch; source/input/encoder changed');
    }
    else
        console.log(output);
    if (process.argv.includes('--write') || process.argv.includes('--check')) {
        const summary = {
            groups: result.groups.map(g => ({
                group: g.groupIndex,
                members: g.members.length,
                groupBytes: g.groupBytes,
                recordBodyBytes: g.recordBodyBytes,
                remaining: g.remainingCarriageBytes
            })),
            admissionExecuted: false,
            fullC0: false
        };
        console.log(JSON.stringify(summary, null, 2));
    }
}
