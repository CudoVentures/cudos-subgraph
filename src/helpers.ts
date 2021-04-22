import {BigInt, BigDecimal, Address} from "@graphprotocol/graph-ts/index";

export const ONE = BigInt.fromI32(1);
export const ZERO_BIG_DECIMAL = BigDecimal.fromString("0")
export const ZERO = BigInt.fromI32(0);

export const ONE_ETH = new BigDecimal(BigInt.fromI32(1).times(BigInt.fromI32(10).pow(18)));

export const ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000")

export function toEther(value: BigInt): BigDecimal {
    return new BigDecimal(value) / ONE_ETH
}

