# Byte-work artifact sizes

Measured from the freshly compiled artifacts after the Name-copy and KMP repair. Solidity 0.8.30, Cancun, optimizer 200 runs, via-IR. All five deployable helpers remain below runtime 24,576 and initcode 49,152 bytes. Oversized inherited Foundry test harness warnings are not deployment evidence.

Command (vault root):

```sh
/opt/homebrew/opt/node/bin/node -e 'const fs=require("fs"),c=require("crypto");for(const [dir,name] of [["FilesNamesProfile.sol","FilesNamesIndex"],["FilesNamesProfile.sol","FilesNameReader"],["FilesCarrierProfile.sol","FilesCarrierIndex"],["FilesPageReader.sol","FilesPageReader"],["FilesPageReader.sol","FilesPagePaid"]]){let a=JSON.parse(fs.readFileSync("/tmp/efs-recovery-build-wPDyNv/out/"+dir+"/"+name+".json"));let runtime=(a.deployedBytecode.object.length-2)/2,init=(a.bytecode.object.length-2)/2;console.log(name,"runtime",runtime,"init",init,"abiSHA256",c.createHash("sha256").update(JSON.stringify(a.abi)).digest("hex"));if(runtime>24576||init>49152)process.exitCode=1;}'
```

Exit: 0.

```text
FilesNamesIndex runtime 8269 init 12490 abiSHA256 dd944a7320b8ca26104ba0694a569ae04bddcd2601dc622b2144e5596966b0b7
FilesNameReader runtime 5215 init 6422 abiSHA256 7a49916bb21a6258250fb224e74a5a51af421076287ad39a838d0623ec670e95
FilesCarrierIndex runtime 11637 init 18626 abiSHA256 d1483a8dfb9120b1962fee3e1ac13ae52fd9f72cd468b94ebb73f1c56480b380
FilesPageReader runtime 16112 init 16694 abiSHA256 12dcef5b5329a4dea2e4ea6b0e04414efe509e24f2143ff87ba55167e62cade6
FilesPagePaid runtime 3135 init 3161 abiSHA256 f11daec02a6bf5918a4a5f0c434c7ca29a3baa31afdec70ae7c401b78ebd3b29
```

The ABI hashes match the cached pre-repair artifacts read before completion of the initial GREEN compile. Source review confirms no public signature or struct change; only private search helpers/signatures changed. This is not a fresh baseline rebuild or a deployment claim.
