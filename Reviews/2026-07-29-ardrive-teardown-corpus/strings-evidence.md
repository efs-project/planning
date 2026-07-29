# ArDrive web app string catalog — distilled evidence extract

Source: `app_en.arb` pulled from the ardrive-web repo (Flutter localization file), 2026-07-29. These are the EXACT user-facing strings in the shipped app (v2.85.x era). 625 strings total; the load-bearing ones grouped below.

## Permanence & pre-upload disclosure

- `onceUploadedCantBeRemoved`: “Once uploaded, your data can’t be removed.”
- `thinkTwiceBeforeUploading`: “Think twice before uploading all your teenage love poetry...”
- `filesWillBePermanentlyPublicWarning`: “Files uploaded here will be permanently viewable by anyone on the internet. Make sure you intend on making this data public.”
- `filesWillBeUploadedPublicly`: “{numberOfFiles, plural, zero{} one{This file will be uploaded publicly.} other{These files will be uploaded publicly.}}”
- `neverDeletedEmphasized`: “NEVER DELETED”
- `secondsFromForeverEmphasized`: “SECONDS FROM FOREVER”
- `onboarding2Description`: “Say goodbye to storage subscriptions! Instead of paying for space you don’t use, just pay once to store your data forever.”
- `monthlyCharges`: “Instead of another monthly charge for empty space you don’t use, pay a few cents once and store your files forever on ArDrive.”

## Password / recovery ceremony

- `passwordCanNeverBeChanged`: “Your password can never be changed or recovered. Please keep it safe!”
- `yourPasswordCannotBeCahngedOrRetrivied`: “Your password cannot be changed or retrieved, so please keep this safe.”
- `passwordCannotBeEmpty`: “Password cannot be empty”

## Hide-not-delete vocabulary

- `hide`: “Hide”
- `unhide`: “Unhide”
- `concealHiddenItems`: “Conceal hidden items”
- `revealHiddenItems`: “Reveal hidden items”
- `driveWasHidden`: “This drive was hidden”
- `fileWasHidden`: “This file was hidden”

## Drive model & attach/detach

- `ardriveIsntJustAnotherCloudSyncApp`: “ArDrive isn’t just another cloud sync app. It’s the beginning of a permanent hard drive.”
- `attachDrive`: “Attach Drive”
- `detachDriveQuestion`: “Are you sure you want to detach '{driveName}'?”
- `copyDriveID`: “Copy Drive ID”
- `syncThisDrive`: “Sync This Drive”
- `deepSyncThisDrive`: “Deep Sync This Drive”
- `syncAllDrivesOnLogin`: “Sync All Drives on Login”
- `drivePrivacyDescriptionPublic`: “Public Drives are discoverable, others can find and view the contents.”
- `drivePrivacyDescriptionPrivate`: “Private Drives offer state-of-the-art security, you control access.”
- `yourPrivateSecureAndPermanentDrive`: “Your private, secure, and permanent hard drive.”

## Sharing

- `anyoneCanAccessThisDrivePublic`: “Anyone can access this public drive using the link above.”
- `anyoneCanAccessThisDrivePrivate`: “Anyone can access this private drive using the link above.”
- `sharedFileIsEncrypted`: “This file is encrypted.”
- `shareFileWithOthers`: “Share file with others”

## Size limits (web)

- `filesTooLargeExplanationPublic`: “ArDrive on web currently only supports file uploads smaller than 1.20 GiB for public drives”
- `filesTooLargeExplanationPrivate`: “ArDrive on web currently only supports file uploads smaller than 100 MiB for private drives”
- `fileFailedToDownloadFileAboveLimit`: “The file you have selected is too large to download from the mobile app”
- `noteFileTooLarge`: “This file is too large to edit ({fileSizeMB}MB). Files over 5MB cannot be edited.”

## Snapshots (user-paid index optimization)

- `createSnapshotExplanation`: “Snapshots reduce the time it takes for the drive to load. Do you want to create a snapshot of your drive {driveName}?”
- `snapshotRecommendedBody`: “Snapshots help speed up the time it takes to sync your large drives. Would you like to try?”
- `determiningSizeAndCostOfSnapshot`: “Determining size and cost of snapshot”
- `insufficientBalanceForSnapshot`: “Provided wallet balance of {walletBalance} AR is not enough for this snapshot transaction costing {totalCost} AR...”
- `snapshotCreationFailed`: “Your snapshot failed. You have not been charged for this failed attempt.”

## Manifests

- `aManifestIsASpecialKindOfFile`: “A manifest is a special kind of file that maps any number of Arweave transactions to friendly path names.”
- `filesPendingManifestExplanation`: “Some of the files in this folder are still pending. We do not recommend creating a manifest with pending files. Would you like to proceed?”
- `conflictingManifestFoundChooseNewName`: “A manifest with the same name already exists at this location. Do you want to continue and upload this manifest as a new version?”

## Payments / Turbo / free tier

- `thisIsAOneTimePaymentPoweredByStripe`: “This is a one-time payment, powered by Stripe.”
- `paymentMethodCard`: “Credit/Debit Card”
- `paymentMethodCrypto`: “Crypto”
- `creditsWillBeAutomaticallyAddedToYourTurboBalance`: “Credits will be automatically added to your Turbo balance, and you can start using them right away.”
- `turboAddCreditsBlurb`: “Add Credits using your card for faster uploads.”
- `freeTurboTransaction`: “Cost: 0 AR / This small transaction is free thanks to Turbo.”
- `freeAllowanceUsedUpUploadNote`: “Free allowance used up. This upload requires Credits or AR.”
- `freeAllowanceExceededUploadNote`: “This upload exceeds your free allowance and will need Credits or AR.”
- `insufficientFundsForUploadFiles`: “You do not have sufficient funds to upload Files at this time. Please go to the top up page to add funds to your account.”

## Wallet / keyfile identity

- `securityWalletOverlay`: “Your keyfile is encrypted, it never leaves your device, and it can be removed from your device at any time.”
- `downloadWalletKeyfile`: “Download Wallet Keyfile”
- `arConnectWalletDoestNotMatchArDriveWallet`: “Your ArConnect wallet does not match your ArDrive wallet. Please try again.”
- `forgetWalletDescription`: “Are you sure you want to forget your wallet? You will need to select another wallet to login with another profile.”
- `howDoesKeyfileLoginWork`: “How do keyfile and seed phrase login work?”

## Gateway lag & network honesty

- `downloadFileNotFoundDescription`: “This file could not be found on the network. It may have been uploaded recently and is still being processed.”
- `downloadNetworkErrorDescription`: “Could not connect to the download server. Please check your connection and try again.”
- `downloadRateLimited`: “Too Many Requests”

## Mobile / platform

- `ardriveIsOptimizedForLargeScreens`: “ArDrive is currently only optimized for larger screens.”

## Pins

- `createNewFilePin`: “Create a New File Pin”
- `fileWasPinnedToTheDrive`: “File pinned to the drive.”
- `fileIsNotPublic`: “The ID provided is for a private file and cannot be pinned.”
