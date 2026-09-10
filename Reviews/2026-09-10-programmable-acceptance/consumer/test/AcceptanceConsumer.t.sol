// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {AcceptanceConsumer, IAcceptanceConsumerCore} from "../src/AcceptanceConsumer.sol";
import {AcceptanceCore} from "acceptance-contracts/src/AcceptanceCore.sol";
import {AT} from "acceptance-contracts/src/AcceptanceTypes.sol";
import {OutfitRule, EquipRule} from "acceptance-contracts/src/OutfitRules.sol";
import {PaidClaimRule} from "acceptance-contracts/src/PaidClaimRule.sol";
import {OutfitCodec} from "acceptance-generated/OutfitCodec.sol";
import {OutfitV2Codec} from "acceptance-generated/OutfitV2Codec.sol";
import {EquipCodec} from "acceptance-generated/EquipCodec.sol";
import {PaidClaimCodec} from "acceptance-generated/PaidClaimCodec.sol";

interface Vm {
    function addr(uint256 privateKey) external returns (address);
    function deal(address who, uint256 newBalance) external;
    function prank(address sender) external;
    function expectRevert(bytes4 selector) external;
    function cool(address target) external;
}

contract AcceptanceConsumerTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    AcceptanceCore private core;
    OutfitRule private outfitRule;
    EquipRule private equipRule;
    PaidClaimRule private paidClaimRule;
    AcceptanceConsumer private consumer;
    address private author;
    bytes32 private outfitType;
    bytes32 private outfitActivation;
    bytes32 private equipType;
    bytes32 private equipActivation;
    bytes32 private claimType;
    bytes32 private claimActivation;
    address private constant TREASURY = address(0xBEEF);
    uint256 private constant CLAIM_FEE = 1 ether;

    event GasMeasurement(string label, uint256 gasUsed);

    function setUp() public {
        core = new AcceptanceCore();
        author = vm.addr(123);
        vm.deal(author, 100 ether);

        outfitRule = new OutfitRule(address(core));
        AT.Rule memory rule = OutfitCodec.rule(address(outfitRule).codehash);
        outfitType = OutfitCodec.register(core, rule);
        bytes32 localConfig = keccak256(abi.encode(address(core)));
        outfitActivation = core.activate(outfitType, address(outfitRule), localConfig);

        equipRule = new EquipRule(address(core), address(this), outfitType);
        AT.Rule memory equipRuleDefinition = EquipCodec.rule(address(equipRule).codehash, outfitType);
        equipType = EquipCodec.register(core, equipRuleDefinition, outfitType);
        bytes32 equipLocalConfig = keccak256(abi.encode(address(core), address(this)));
        equipActivation = core.activate(equipType, address(equipRule), equipLocalConfig);

        paidClaimRule = new PaidClaimRule(address(core), TREASURY, CLAIM_FEE);
        AT.Rule memory claimRuleDefinition = PaidClaimCodec.rule(address(paidClaimRule).codehash, CLAIM_FEE);
        claimType = PaidClaimCodec.register(core, claimRuleDefinition, CLAIM_FEE);
        bytes32 claimLocalConfig = keccak256(abi.encode(address(core), TREASURY));
        claimActivation = core.activate(claimType, address(paidClaimRule), claimLocalConfig);

        consumer = new AcceptanceConsumer(
            IAcceptanceConsumerCore(address(core)),
            author,
            AcceptanceConsumer.ActivationPin(outfitActivation, address(outfitRule), localConfig),
            AcceptanceConsumer.ActivationPin(equipActivation, address(equipRule), equipLocalConfig),
            AcceptanceConsumer.ActivationPin(claimActivation, address(paidClaimRule), claimLocalConfig),
            CLAIM_FEE
        );
    }

    function testReadsHistoricalOutfitWithNamedFields() public {
        AT.Plan memory plan = AT.Plan({
            author: author, executor: address(0), nonce: 0, deadline: block.timestamp + 100, items: new AT.Item[](1)
        });
        plan.items[0] = AT.Item(outfitType, outfitActivation, abi.encode(uint256(2), uint256(3), uint256(1)), 0);

        vm.prank(author);
        bytes32 receiptId = core.execute(plan, "")[0];

        (AcceptanceConsumer.HistoricalAcceptance memory accepted, OutfitCodec.Fields memory fields) =
            consumer.readOutfit(receiptId);

        require(accepted.receiptId == receiptId, "wrong receipt");
        require(accepted.author == author, "wrong accepted author");
        require(accepted.acceptedAtBlock == block.number, "wrong accepted block");
        require(fields.species == 2, "wrong species");
        require(fields.shirt == 3, "wrong shirt");
        require(fields.pants == 1, "wrong pants");
    }

    function testReadsAcceptedEquipAfterPolicyChangeWithoutRevalidating() public {
        bytes32 outfitReceipt = _publishOutfit(author, outfitActivation, 2, 3, 1);
        AT.Plan memory plan = _singleItemPlan(author, AT.Item(equipType, equipActivation, abi.encode(outfitReceipt), 0));
        vm.prank(author);
        bytes32 equipReceipt = core.execute(plan, "")[0];

        equipRule.setAllowed(false);

        (AcceptanceConsumer.HistoricalAcceptance memory accepted, EquipCodec.Fields memory fields) =
            consumer.readEquip(equipReceipt);
        require(accepted.receiptId == equipReceipt, "wrong Equip receipt");
        require(fields.outfitReceipt == outfitReceipt, "wrong Outfit reference");
        require(consumer.isGrandfatheredUnderPinnedPolicy(equipReceipt), "history not grandfathered");

        plan.nonce = core.nonces(author);
        vm.prank(author);
        (bool acceptedNew,) = address(core).call(abi.encodeCall(core.execute, (plan, "")));
        require(!acceptedNew, "policy change allowed new Equip");
    }

    function testEquipReaderRefusesOldOutfitAsNewEquip() public {
        bytes32 outfitReceipt = _publishOutfit(author, outfitActivation, 2, 3, 1);
        vm.expectRevert(AcceptanceConsumer.WrongExactType.selector);
        consumer.readEquip(outfitReceipt);
    }

    function testCurrentPolicyQueryRefusesOldOutfitAsEquip() public {
        bytes32 outfitReceipt = _publishOutfit(author, outfitActivation, 2, 3, 1);
        vm.expectRevert(AcceptanceConsumer.WrongExactType.selector);
        consumer.isGrandfatheredUnderPinnedPolicy(outfitReceipt);
    }

    function testReadsPaidClaimWithNamedFieldAndHistoricalContext() public {
        bytes32 expectedClaimKey = bytes32(uint256(0xCAFE));
        AT.Plan memory plan =
            _singleItemPlan(author, AT.Item(claimType, claimActivation, abi.encode(expectedClaimKey), CLAIM_FEE));
        vm.prank(author);
        bytes32 receiptId = core.execute{value: CLAIM_FEE}(plan, "")[0];

        (AcceptanceConsumer.HistoricalAcceptance memory accepted, PaidClaimCodec.Fields memory fields) =
            consumer.readPaidClaim(receiptId);

        require(accepted.receiptId == receiptId, "wrong claim receipt");
        require(accepted.basis != bytes32(0), "missing application basis");
        require(fields.claimKey == bytes32(uint256(0xCAFE)), "wrong claim key");
    }

    function testAdditiveOutfitV2IsNotAcceptedAsOutfitV1() public {
        AT.Rule memory v2Rule = OutfitV2Codec.rule(address(outfitRule).codehash);
        bytes32 v2Type = OutfitV2Codec.register(core, v2Rule);
        bytes32 v2Activation = core.activate(v2Type, address(outfitRule), keccak256(abi.encode(address(core))));
        AT.Plan memory plan = _singleItemPlan(
            author,
            AT.Item(
                v2Type,
                v2Activation,
                OutfitV2Codec.encode(OutfitV2Codec.Fields({species: 2, shirt: 3, pants: 1, badge: 99})),
                0
            )
        );
        vm.prank(author);
        bytes32 receiptId = core.execute(plan, "")[0];

        vm.expectRevert(AcceptanceConsumer.WrongExactType.selector);
        consumer.readOutfit(receiptId);
    }

    function testRawLinkIsNotHistoricalAcceptance() public {
        bytes32 rawId = core.retainRaw(bytes32(uint256(0x1234)));
        vm.expectRevert(AcceptanceConsumer.NotAccepted.selector);
        consumer.readEquip(rawId);
    }

    function testOutfitReaderRefusesWrongAuthor() public {
        address otherAuthor = vm.addr(456);
        vm.deal(otherAuthor, 1 ether);
        bytes32 receiptId = _publishOutfit(otherAuthor, outfitActivation, 2, 3, 1);

        vm.expectRevert(AcceptanceConsumer.WrongAuthor.selector);
        consumer.readOutfit(receiptId);
    }

    function testOutfitReaderRefusesWrongLocalActivation() public {
        OutfitRule otherRule = new OutfitRule(address(core));
        bytes32 otherActivation = core.activate(outfitType, address(otherRule), keccak256(abi.encode(address(core))));
        bytes32 receiptId = _publishOutfit(author, otherActivation, 2, 3, 1);

        vm.expectRevert(AcceptanceConsumer.WrongActivation.selector);
        consumer.readOutfit(receiptId);
    }

    function testStagedEquipRetainsDeclaredZeroWithoutGenericResolution() public {
        AT.Plan memory plan = AT.Plan({
            author: author,
            executor: address(0),
            nonce: core.nonces(author),
            deadline: block.timestamp + 100,
            items: new AT.Item[](2)
        });
        plan.items[0] = AT.Item(
            outfitType, outfitActivation, OutfitCodec.encode(OutfitCodec.Fields({species: 2, shirt: 3, pants: 1})), 0
        );
        plan.items[1] =
            AT.Item(equipType, equipActivation, EquipCodec.encode(EquipCodec.Fields({outfitReceipt: bytes32(0)})), 0);
        vm.prank(author);
        bytes32 equipReceipt = core.execute(plan, "")[1];

        (, EquipCodec.Fields memory fields) = consumer.readEquip(equipReceipt);
        require(fields.outfitReceipt == bytes32(0), "consumer invented a generic link");
    }

    function testReadRefusesForgedBodyCommitment() public {
        (ForgedReadCore fake, AcceptanceConsumer fakeConsumer) = _fakeConsumer();
        bytes memory body = OutfitCodec.encode(OutfitCodec.Fields({species: 2, shirt: 3, pants: 1}));
        AT.Receipt memory receipt = _fakeReceipt(address(fake));
        receipt.bodyHash = keccak256("different body");
        bytes32 id = fake.receiptId(receipt.planId, receipt.index);
        fake.setEvidence(id, receipt, body);

        vm.expectRevert(AcceptanceConsumer.BodyCommitmentMismatch.selector);
        fakeConsumer.readOutfit(id);
    }

    function testReadRefusesForgedReceiptIdentity() public {
        (ForgedReadCore fake, AcceptanceConsumer fakeConsumer) = _fakeConsumer();
        bytes memory body = OutfitCodec.encode(OutfitCodec.Fields({species: 2, shirt: 3, pants: 1}));
        AT.Receipt memory receipt = _fakeReceipt(address(fake));
        receipt.bodyHash = keccak256(body);
        bytes32 wrongId = bytes32(uint256(0xBAD));
        fake.setEvidence(wrongId, receipt, body);

        vm.expectRevert(AcceptanceConsumer.WrongReceiptId.selector);
        fakeConsumer.readOutfit(wrongId);
    }

    function testReadRefusesForgedRuleIdentity() public {
        (ForgedReadCore fake, AcceptanceConsumer fakeConsumer) = _fakeConsumer();
        bytes memory body = abi.encode(uint256(2), uint256(3), uint256(1));
        AT.Receipt memory receipt = _fakeReceipt(address(fake));
        receipt.bodyHash = keccak256(body);
        receipt.ruleId = bytes32(uint256(0xBAD));
        bytes32 id = fake.receiptId(receipt.planId, receipt.index);
        fake.setEvidence(id, receipt, body);

        vm.expectRevert(AcceptanceConsumer.WrongRule.selector);
        fakeConsumer.readOutfit(id);
    }

    function testReadRefusesForgedCoreContext() public {
        (ForgedReadCore fake, AcceptanceConsumer fakeConsumer) = _fakeConsumer();
        bytes memory body = OutfitCodec.encode(OutfitCodec.Fields({species: 2, shirt: 3, pants: 1}));
        AT.Receipt memory receipt = _fakeReceipt(address(core));
        receipt.bodyHash = keccak256(body);
        bytes32 id = fake.receiptId(receipt.planId, receipt.index);
        fake.setEvidence(id, receipt, body);

        vm.expectRevert(AcceptanceConsumer.WrongCoreContext.selector);
        fakeConsumer.readOutfit(id);
    }

    function testReadRefusesWrongChainWithCorrectCore() public {
        (ForgedReadCore fake, AcceptanceConsumer fakeConsumer) = _fakeConsumer();
        bytes memory body = abi.encode(uint256(2), uint256(3), uint256(1));
        AT.Receipt memory receipt = _fakeReceipt(address(fake));
        receipt.bodyHash = keccak256(body);
        receipt.chainId = block.chainid + 1;
        bytes32 id = fake.receiptId(receipt.planId, receipt.index);
        fake.setEvidence(id, receipt, body);

        vm.expectRevert(AcceptanceConsumer.WrongCoreContext.selector);
        fakeConsumer.readOutfit(id);
    }

    function testConstructorRefusesMismatchedLocalActivationPin() public {
        bytes32 equipLocalConfig = core.getActivation(equipActivation).localConfig;
        bytes32 claimLocalConfig = core.getActivation(claimActivation).localConfig;
        vm.expectRevert(AcceptanceConsumer.InvalidActivationPin.selector);
        new AcceptanceConsumer(
            IAcceptanceConsumerCore(address(core)),
            author,
            AcceptanceConsumer.ActivationPin(outfitActivation, address(outfitRule), bytes32(uint256(1))),
            AcceptanceConsumer.ActivationPin(equipActivation, address(equipRule), equipLocalConfig),
            AcceptanceConsumer.ActivationPin(claimActivation, address(paidClaimRule), claimLocalConfig),
            CLAIM_FEE
        );
    }

    function testConstructorRefusesAlteredPaidClaimRuleParameters() public {
        bytes32 outfitLocalConfig = core.getActivation(outfitActivation).localConfig;
        bytes32 equipLocalConfig = core.getActivation(equipActivation).localConfig;
        bytes32 claimLocalConfig = core.getActivation(claimActivation).localConfig;
        vm.expectRevert(AcceptanceConsumer.InvalidTypePin.selector);
        new AcceptanceConsumer(
            IAcceptanceConsumerCore(address(core)),
            author,
            AcceptanceConsumer.ActivationPin(outfitActivation, address(outfitRule), outfitLocalConfig),
            AcceptanceConsumer.ActivationPin(equipActivation, address(equipRule), equipLocalConfig),
            AcceptanceConsumer.ActivationPin(claimActivation, address(paidClaimRule), claimLocalConfig),
            CLAIM_FEE + 1
        );
    }

    function testMeasureHistoricalOutfitReadGas() public {
        bytes32 receiptId = _publishOutfit(author, outfitActivation, 2, 3, 1);

        vm.cool(address(consumer));
        vm.cool(address(core));
        uint256 before = gasleft();
        consumer.readOutfit(receiptId);
        uint256 coldConsumer = before - gasleft();

        before = gasleft();
        consumer.readOutfit(receiptId);
        uint256 warmConsumer = before - gasleft();

        vm.cool(address(core));
        before = gasleft();
        core.getReceipt(receiptId);
        core.getBody(receiptId);
        uint256 coldRaw = before - gasleft();

        before = gasleft();
        core.getReceipt(receiptId);
        core.getBody(receiptId);
        uint256 warmRaw = before - gasleft();

        bytes memory callData = abi.encodeCall(consumer.readOutfit, (receiptId));
        uint256 externalTransactionEstimate = 21_000 + _calldataGas(callData) + coldConsumer;

        emit GasMeasurement("consumer.readOutfit cold execution", coldConsumer);
        emit GasMeasurement("consumer.readOutfit warm execution", warmConsumer);
        emit GasMeasurement("Core receipt+body cold execution", coldRaw);
        emit GasMeasurement("Core receipt+body warm execution", warmRaw);
        emit GasMeasurement("consumer.readOutfit transaction upper estimate", externalTransactionEstimate);
    }

    function _publishOutfit(address planAuthor, bytes32 activation, uint256 species, uint256 shirt, uint256 pants)
        private
        returns (bytes32)
    {
        AT.Item memory item = AT.Item(
            outfitType,
            activation,
            OutfitCodec.encode(OutfitCodec.Fields({species: species, shirt: shirt, pants: pants})),
            0
        );
        AT.Plan memory plan = _singleItemPlan(planAuthor, item);
        vm.prank(planAuthor);
        return core.execute(plan, "")[0];
    }

    function _singleItemPlan(address planAuthor, AT.Item memory item) private view returns (AT.Plan memory plan) {
        plan = AT.Plan({
            author: planAuthor,
            executor: address(0),
            nonce: core.nonces(planAuthor),
            deadline: block.timestamp + 100,
            items: new AT.Item[](1)
        });
        plan.items[0] = item;
    }

    function _fakeConsumer() private returns (ForgedReadCore fake, AcceptanceConsumer fakeConsumer) {
        AT.TypeInfo memory registered = core.getType(outfitType);
        AT.Activation memory activation = core.getActivation(outfitActivation);
        fake = new ForgedReadCore(outfitType, registered, outfitActivation, activation);
        fake.seedType(equipType, core.getType(equipType));
        fake.seedActivation(equipActivation, core.getActivation(equipActivation));
        fake.seedType(claimType, core.getType(claimType));
        fake.seedActivation(claimActivation, core.getActivation(claimActivation));
        fakeConsumer = new AcceptanceConsumer(
            IAcceptanceConsumerCore(address(fake)),
            author,
            AcceptanceConsumer.ActivationPin(
                outfitActivation, address(outfitRule), keccak256(abi.encode(address(core)))
            ),
            AcceptanceConsumer.ActivationPin(
                    equipActivation, address(equipRule), core.getActivation(equipActivation).localConfig
                ),
            AcceptanceConsumer.ActivationPin(
                claimActivation, address(paidClaimRule), core.getActivation(claimActivation).localConfig
            ),
            CLAIM_FEE
        );
    }

    function _fakeReceipt(address receiptCore) private view returns (AT.Receipt memory receipt) {
        receipt = AT.Receipt({
            accepted: true,
            author: author,
            typeId: outfitType,
            bodyHash: bytes32(0),
            ruleId: core.getType(outfitType).ruleId,
            activationId: outfitActivation,
            basis: bytes32(uint256(0xB4515)),
            planId: bytes32(uint256(0xCA11)),
            index: 4,
            blockNumber: block.number,
            chainId: block.chainid,
            core: receiptCore,
            submitter: author
        });
    }

    function _calldataGas(bytes memory data) private pure returns (uint256 gasCost) {
        for (uint256 i; i < data.length; ++i) {
            gasCost += data[i] == 0 ? 4 : 16;
        }
    }
}

contract ForgedReadCore is IAcceptanceConsumerCore {
    mapping(bytes32 => AT.TypeInfo) private types;
    mapping(bytes32 => AT.Activation) private activations;
    mapping(bytes32 => AT.Receipt) private receipts;
    mapping(bytes32 => bytes) private bodies;

    constructor(bytes32 typeId, AT.TypeInfo memory typeInfo, bytes32 activationId, AT.Activation memory activation) {
        types[typeId] = typeInfo;
        activations[activationId] = activation;
    }

    function setEvidence(bytes32 id, AT.Receipt memory receipt, bytes memory body) external {
        receipts[id] = receipt;
        bodies[id] = body;
    }

    function seedType(bytes32 id, AT.TypeInfo memory typeInfo) external {
        types[id] = typeInfo;
    }

    function seedActivation(bytes32 id, AT.Activation memory activation) external {
        activations[id] = activation;
    }

    function getType(bytes32 id) external view returns (AT.TypeInfo memory) {
        return types[id];
    }

    function getActivation(bytes32 id) external view returns (AT.Activation memory) {
        return activations[id];
    }

    function getReceipt(bytes32 id) external view returns (AT.Receipt memory) {
        return receipts[id];
    }

    function getBody(bytes32 id) external view returns (bytes memory) {
        return bodies[id];
    }

    function receiptId(bytes32 planId, uint256 index) external pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs.acceptance.receipt.v1"), planId, index));
    }
}
