import { ServiceProvider } from '../generated/templates'
import {
    MaxStakingAmountForServiceProvidersUpdated,
    MinRequiredStakingAmountForServiceProvidersUpdated,
    MinServiceProviderFeeUpdated,
    ServiceProviderWhitelisted
} from "../generated/StakingRewards/StakingRewards";
import { safeLoadServiceProvider } from "./service-provider-mapping";
import { BigInt } from "@graphprotocol/graph-ts";
import { StakingReward } from "../generated/schema";

export function safeLoadStakingRewards(id: string): StakingReward {
    let entity = StakingReward.load(id)

    if (entity == null) {
        entity = new StakingReward(id)
        entity.minServiceProviderFee = BigInt.fromI32(200)
        entity.minRequiredStakingAmountForServiceProviders = BigInt.fromI32(2_000_000).times((BigInt.fromI32(10).pow(18))) // 2_000_000 * 10 ** 18
        entity.maxStakingAmountForServiceProviders = BigInt.fromI32(1_000_000_000).times((BigInt.fromI32(10).pow(18))) // 1_000_000_000 * 10 ** 18
    }

    return entity as StakingReward
}

export function handleNewServiceProviderWhitelisted(event: ServiceProviderWhitelisted): void {
    // Start indexing the exchange; `event.params.exchange` is the
    // address of the new exchange contract
    // create the service provider in the store as well
    const stakingRewards = safeLoadStakingRewards(event.address.toHexString());
    stakingRewards.save()
    const serviceProvider = safeLoadServiceProvider(event.params.serviceProviderContract.toHexString());
    serviceProvider.serviceProvider = event.params.serviceProvider
    serviceProvider.serviceProviderBond = stakingRewards.minRequiredStakingAmountForServiceProviders
    serviceProvider.save()
    ServiceProvider.create(event.params.serviceProviderContract)
}

export function handleMinServiceProviderFeeUpdated(event: MinServiceProviderFeeUpdated): void {
    const stakingRewards = safeLoadStakingRewards(event.address.toHexString());
    stakingRewards.minServiceProviderFee = event.params.newValue
    stakingRewards.save()
}

export function handleMinRequiredStakingAmountForServiceProvidersUpdated(event: MinRequiredStakingAmountForServiceProvidersUpdated): void {
    const stakingRewards = safeLoadStakingRewards(event.address.toHexString());
    stakingRewards.minRequiredStakingAmountForServiceProviders = event.params.newValue
    stakingRewards.save()
}
export function handleMaxStakingAmountForServiceProvidersUpdated(event: MaxStakingAmountForServiceProvidersUpdated): void {
    const stakingRewards = safeLoadStakingRewards(event.address.toHexString());
    stakingRewards.maxStakingAmountForServiceProviders = event.params.newValue
    stakingRewards.save()
}
