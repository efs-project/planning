# James's EFS v2 MVP brief (owner's original kickoff)

**Status:** reference: the owner's own direction, recorded verbatim. Where it conflicts with a later recorded ruling, the ruling wins.
**Given:** 2026-11-24, by @james to @pm. It was written before the three dev sessions started coordinating, and pasted to @pm afterwards "so it's not lost". The same text reached the client dev earlier that day.
**Use:** read it before deciding anything about the v2 MVP's scope, UX, client architecture or the tag model.

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## Known to be superseded or refined since

These notes were added by @pm on 2026-11-24. The brief itself is unchanged.

- **The tag model is open for discussion.** The brief says "A folder is a tag… tag only model". Later the same day @james asked for "a few rounds of discussion" on tags before major dev, and said the v2 data model may change. Until that discussion concludes, folder, path and tag work is held across all three repos. The 2026-09-10 tag rulings D-A, D-B and D-E still stand.
- **Prompt budget.** "Reducing the number of prompts to zero or one or two at most" is a hard UX requirement, per @james's reply to the client dev. @james's 2026-09-03 ruling already allows one bounded session-key grant for zero routine prompts.
- **Large files.** "Large files is the contract dev's job" (@james to the client dev). The measured cost (C11) is in [[2026-11-24-m1-integration-brief]].
- **Naming.** Name everything as if v1 never existed: "EFS SDK v0.1", no "v2" in public names (@james to the SDK dev, same day).
- **Working order and shared interfaces.** [[2026-11-24-m1-integration-brief]] records the cross-repo working order, the agreed shared interfaces, and @pm's working defaults.

## The brief, verbatim

> I haven't read your plan yet. My goal is to have an EFS v2 SPA web client using the v2 SDK pointed to v2 contracts and have it replicate the base functionality of the existing EFS v1 application. Create, rename, and delete files. Tag files. Be able to attach files to folders and addresses. Being able to filter a view by "schema" or whatever we call it in EFS v2.
>
> The web client is an OS, so it should be architected that way, but just showing a single "app" which is the "file browser" is enough for the MVP. Path at the top with clickable path sections (Web Awesome makes this easy) and a highly usable tree view on the left. Content to the right of the tree view in columns which will serve as "views" and be configurable later. For example, EFS v1 has a README.md markdown view pane first then the file list then the selected file as the 3 panes. The client dev should be aware of this but ensure we use Web Awesome as best we can for theming, accessibility, etc. It's the only library (besides Lit and Signals) we use as we are trying to be as web native as possible for software longevity and maintenance so if there's a global shim we can use then go ahead but if it causes any trouble at all or makes maintenance harder then just leaning into Web Awesome is my preference since WA is based on web components and other standards and should be safe. We should definitely use the newest version and grab the agent version of the web awesome docs so the dev agent knows how to use it effectively. And use Signals very effectively. We aren't using a framework like React, Vue, or Svelte but we need to architect our page in a similar way. Frameworks change a lot so I am wary of building the app around one of them but also know that doing it ourselves will be hard and increase our maintenance burden (and if the dev has pushback or thoughts on this please surface them to me). The client dev will need to think, design, and build carefully around this will a high effort smart model.
>
> Also, I don't know how the EFS v2 data model works. I probably should ask questions and drill down but I'm running out of time. In my mind there's an underlying data structure that's portable across chains, has metadata like who published the data, who created it, what time etc with tags being the main operational layer. A folder is a tag. Copyright is a tag. Tags are hierarchical so /car/tesla/ and /person/tesla/ are both Tesla tags but are distinct. A lot like the boorus. A tag only model makes things cognitively simply and seems like how modern applications like Obsidian, Gmail, etc are structured while still allowing for hierarchical "folders" to be supported for easy browsing and categorization.
>
> We made the 3 repos but it was disjointed and not coordinated well. Your job is to coordinate them, keep them working towards a common goal of having a client boot, connect to a test chain, and run through basic workflows correctly. It's important that the agents keep their existing design documents in mind when doing the dev so we don't need to go back and re-do big parts of the app because we didn't shim in parts for us to flesh out later. This is especially important for the web client as it has a lot of future OS stuff that needs to be accounted for even in the MVP like offline mode, fast loading, modularity, etc that will be hard to retrofit later.
>
> Do you understand all of this? And before we start please ask questions, clarifications, tell me your ideas, thoughts, and concerns before we start. And do either queue up questions or spicy decision points for me or ask interactively if you need my input immediately. I am trusting you to help me get EFS v2 to a basic usable state.
>
> Your job is to communicate with, push forward, and keep the 3 EFS v2 dev agents on track and get the EFS v2 (matching basic EFS v1) MVP working. Be sure to use the right models and thinking settings for each task to maximize inference efficiency. Hopefully the dev agents can do the same. Fable is good for specific design and hard engineering tasks but is expensive. Opus for a lot of stuff. Maybe Sonnet and Haiku for straightforward things. Use your best judgement. Set a goal / loop if needed so you keep working. Surface things to me when needed.
