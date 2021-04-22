import {
    Delegator,
    ServiceProvider
} from "../generated/schema";

import {
    StakedServiceProviderBond,
    AddDelegatedStake,
    WithdrawDelegatedStakeRequested,
    WithdrewDelegatedStake,
    ServiceProvider as ServiceProviderContract
} from "../generated/ServiceProvider/ServiceProvider"

import {ZERO} from "./helpers"
import {Address} from "@graphprotocol/graph-ts/index";

// loads a delegator for a specific service provider
function safeLoadDelegator(delegator: Address, serviceProvider: Address): Delegator {
    let id = delegator.toHexString() "-" + serviceProvider.toHexString()
    let entity = Delegator.load(id)

    if (entity == null) {
        entity = new Delegator(id)
        entity.delegator = delegator
        entity.serviceProvider = serviceProvider
        entity.delegatedStake = ZERO
        entity.withdrawalRequested = false
        entity.withdrawalRequestAmount = ZERO
        entity.withdrawalPermittedFrom = ZERO
    }

    return entity as Delegator
}

function safeLoadServiceProvider(id: string): ServiceProvider {
    let entity = ServiceProvider.load(id)

    if (entity == null) {
        entity = new ServiceProvider(id)
        entity.isServiceProviderActive = false
        entity.exited = false
        entity.rewardsFeePercentage = ZERO
        entity.totalDelegatedStake = ZERO
        entity.rewardsProgrammeId
    }

    return entity as ServiceProvider
}

export function handleServiceProviderStakedBond(event: StakedServiceProviderBond): void {
    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.isServiceProviderActive = true
    serviceProvider.rewardsProgrammeId = event.params.pid

    const serviceProviderContract = ServiceProviderContract.bind(event.address)
    serviceProvider.rewardsFeePercentage = serviceProviderContract.rewardsFeePercentage()

    serviceProvider.save()
}

export function handleStakeDelegatedToServiceProvider(event: AddDelegatedStake): void {
    let delegator = safeLoadDelegator(event.params.user, event.address)

    delegator.delegatedStake = event.params.totalAmount

    delegator.save()

    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake + event.params.amount
    serviceProvider.save()
}

export function handleDelegatedStakeWithdrawalRequested(event: WithdrawDelegatedStakeRequested): void {
    let delegator = safeLoadDelegator(event.params.user, event.address)

    delegator.withdrawalRequested = true
    delegator.withdrawalRequestAmount = delegator.withdrawalRequestAmount + event.params.amount

    const serviceProviderContract = ServiceProviderContract.bind(event.address)
    delegator.withdrawalPermittedFrom = serviceProviderContract.withdrawalRequest(event.params.user).value0

    delegator.save()
}

export function handleDelegatedStakeWithdrawn(event: WithdrewDelegatedStake): void {
    let delegator = safeLoadDelegator(event.params.user, event.address)

    delegator.withdrawalRequested = false
    delegator.withdrawalRequestAmount = ZERO
    delegator.withdrawalPermittedFrom = ZERO

    delegator.delegatedStake = event.params.totalAmount

    delegator.save()

    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake - event.params.amount
    serviceProvider.save()
}
