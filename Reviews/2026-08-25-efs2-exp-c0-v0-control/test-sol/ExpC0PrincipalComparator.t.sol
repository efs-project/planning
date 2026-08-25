// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0PrincipalComparator} from "../src-sol/ExpC0PrincipalComparator.sol";

contract ExpC0PrincipalComparatorTest {
    ExpC0PrincipalComparator internal comparator;

    bytes32 internal constant EXPECTED_EOA_PRINCIPAL =
        0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc;
    bytes32 internal constant EXPECTED_1271_PRINCIPAL =
        0x1fc209a0c0dee081630ce271766c6c14d76926feb5f5d3a4c0898afc742e70c4;
    bytes32 internal constant EXPECTED_TAGGED_EOA = 0x72ca1c2ff7d5ecc65d302f5c63674a4a9e44f666c2a37ee09c5165d4da6fbcea;
    bytes32 internal constant EXPECTED_TAGGED_1271 = 0x10f023e316bf74027001066179a05578512b51589a8b09025139e9f8e94e470d;
    bytes32 internal constant EXPECTED_TAGGED_MANAGED =
        0x8351faf1c030472ffdbbcc117fc35fb25660431488df3a9792daebd5d9ba8038;

    function setUp() public {
        comparator = new ExpC0PrincipalComparator();
    }

    function testCrossLanguageIdentityAndSignatureVectors() external view {
        ExpC0PrincipalComparator.Principal memory eoa = _eoa();
        ExpC0PrincipalComparator.Principal memory erc1271 = _erc1271();
        ExpC0PrincipalComparator.AuthorRef memory taggedEoa = _taggedAccount(eoa.account);
        ExpC0PrincipalComparator.AuthorRef memory tagged1271 = _taggedAccount(erc1271.account);

        _assertEq(comparator.uniformPrincipalId(eoa), EXPECTED_EOA_PRINCIPAL);
        _assertEq(comparator.uniformPrincipalId(erc1271), EXPECTED_1271_PRINCIPAL);
        _assertEq(comparator.taggedAuthorKey(taggedEoa), EXPECTED_TAGGED_EOA);
        _assertEq(comparator.taggedAuthorKey(tagged1271), EXPECTED_TAGGED_1271);
        _assertEq(comparator.taggedAuthorKey(_taggedManaged()), EXPECTED_TAGGED_MANAGED);

        _assertEq(
            comparator.signatureDigest(_b32(0xdd), EXPECTED_EOA_PRINCIPAL, _b32(0x91)),
            0x001e26da2d1184c1215e42f382a1a7bd4a2fcfe87039e753cc7e2bf5564d022b
        );
        _assertEq(
            comparator.signatureDigest(_b32(0xdd), EXPECTED_TAGGED_EOA, _b32(0x91)),
            0x3f0278924b68c669a0aabe432823863df72df50491958cf458e4a0ef29142b07
        );
    }

    function testExactAbiSizesAndAuthorityBinding() external view {
        ExpC0PrincipalComparator.Principal memory eoa = _eoa();
        ExpC0PrincipalComparator.Principal memory erc1271 = _erc1271();
        require(abi.encode(eoa).length == 160, "EOA descriptor ABI size");
        require(abi.encode(erc1271).length == 192, "1271 descriptor ABI size");
        require(abi.encode(EXPECTED_EOA_PRINCIPAL).length == 32, "uniform author API size");
        require(abi.encode(_taggedAccount(eoa.account)).length == 64, "tagged author API size");

        eoa.authorityKind = 2;
        require(comparator.uniformPrincipalId(eoa) != EXPECTED_EOA_PRINCIPAL, "kind must bind uniform ID");
        ExpC0PrincipalComparator.AuthorRef memory tagged = _taggedAccount(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa);
        require(comparator.taggedAuthorKey(tagged) == EXPECTED_TAGGED_EOA, "ACCOUNT tag omits authority class");
    }

    function testRepresentativeFullWidthKeyedReadWriteForBothArms() external {
        bytes32 first = 0x111111111111111111111111abababababababababababababababababababab;
        bytes32 second = 0x222222222222222222222222abababababababababababababababababababab;
        comparator.writeUniform(first, _b32(0x31));
        comparator.writeUniform(second, _b32(0x32));
        _assertEq(comparator.readUniform(first), _b32(0x31));
        _assertEq(comparator.readUniform(second), _b32(0x32));

        ExpC0PrincipalComparator.AuthorRef memory firstRef = ExpC0PrincipalComparator.AuthorRef(1, first);
        ExpC0PrincipalComparator.AuthorRef memory secondRef = ExpC0PrincipalComparator.AuthorRef(1, second);
        comparator.writeTagged(firstRef, _b32(0x41));
        comparator.writeTagged(secondRef, _b32(0x42));
        _assertEq(comparator.readTagged(firstRef), _b32(0x41));
        _assertEq(comparator.readTagged(secondRef), _b32(0x42));
    }

    function testManagedAssociationIsProspectiveAndNeverRewritesOldKeys() external {
        comparator.writeUniform(EXPECTED_EOA_PRINCIPAL, _b32(0x51));
        comparator.associateUniform(EXPECTED_EOA_PRINCIPAL, _b32(0xee), 17);
        _assertEq(comparator.readUniform(EXPECTED_EOA_PRINCIPAL), _b32(0x51));
        (bytes32 managedRef, uint64 uniformSince) = comparator.uniformGovernance(EXPECTED_EOA_PRINCIPAL);
        _assertEq(managedRef, _b32(0xee));
        require(uniformSince == 17, "uniform association ordinal");

        ExpC0PrincipalComparator.AuthorRef memory accountRef =
            _taggedAccount(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa);
        ExpC0PrincipalComparator.AuthorRef memory managedPrincipal = _taggedManaged();
        comparator.writeTagged(accountRef, _b32(0x61));
        comparator.associateTagged(accountRef, managedPrincipal, 17);
        _assertEq(comparator.readTagged(accountRef), _b32(0x61));
        _assertEq(comparator.readTagged(managedPrincipal), bytes32(0));
        (bytes32 managedKey, uint64 taggedSince) = comparator.taggedAssociation(EXPECTED_TAGGED_EOA);
        _assertEq(managedKey, EXPECTED_TAGGED_MANAGED);
        require(taggedSince == 17, "tagged association ordinal");
        require(managedKey != EXPECTED_TAGGED_EOA, "tagged arm must expose second keyspace");
    }

    function _eoa() internal pure returns (ExpC0PrincipalComparator.Principal memory) {
        return ExpC0PrincipalComparator.Principal(1, bytes(""), 0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa);
    }

    function _erc1271() internal pure returns (ExpC0PrincipalComparator.Principal memory) {
        return
            ExpC0PrincipalComparator.Principal(
                2, bytes("evm:31337:genesis-A"), 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB
            );
    }

    function _taggedAccount(address account) internal pure returns (ExpC0PrincipalComparator.AuthorRef memory) {
        return ExpC0PrincipalComparator.AuthorRef(0, bytes32(uint256(uint160(account))));
    }

    function _taggedManaged() internal pure returns (ExpC0PrincipalComparator.AuthorRef memory) {
        return ExpC0PrincipalComparator.AuthorRef(1, _b32(0xcc));
    }

    function _b32(uint8 value) internal pure returns (bytes32) {
        return bytes32(type(uint256).max / type(uint8).max * uint256(value));
    }

    function _assertEq(bytes32 actual, bytes32 expected) internal pure {
        require(actual == expected, "vector mismatch");
    }
}
