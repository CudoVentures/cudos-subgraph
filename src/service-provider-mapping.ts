import {
    Delegation,
    ServiceProvider
} from "../generated/schema";

import {
    StakedServiceProviderBond,
    AddDelegatedStake,
    WithdrawDelegatedStakeRequested,
    WithdrewDelegatedStake,
    ServiceProvider as ServiceProviderContract,
    IncreasedServiceProviderBond,
    DecreasedServiceProviderBond,
    ExitedServiceProviderBond, ExitDelegatedStake
} from "../generated/templates/ServiceProvider/ServiceProvider"

import {ZERO, ZERO_ADDRESS} from "./helpers"
import {Address} from "@graphprotocol/graph-ts/index";
import {BigInt} from "@graphprotocol/graph-ts";

// loads a delegator for a specific service provider
function safeLoadDelegator(delegator: Address, serviceProvider: Address): Delegation {
    let id = delegator.toHexString() + serviceProvider.toHexString()

    let entity = Delegation.load(id)

    if (entity == null) {
        entity = new Delegation(id)
        entity.delegator = delegator
        entity.serviceProvider = serviceProvider
        entity.delegatedStake = ZERO
        entity.withdrawalRequested = false
        entity.withdrawalRequestAmount = ZERO
        entity.withdrawalPermittedFrom = ZERO
    }

    return entity as Delegation
}

export function safeLoadServiceProvider(id: string): ServiceProvider {
    let entity = ServiceProvider.load(id)

    if (entity == null) {
        entity = new ServiceProvider(id)
        entity.serviceProvider = ZERO_ADDRESS
        entity.serviceProviderManager = ZERO_ADDRESS
        entity.isServiceProviderActive = false
        entity.exited = false
        entity.rewardsFeePercentage = ZERO
        entity.totalDelegatedStake = ZERO
        entity.rewardsProgrammeId = ZERO
        entity.withdrawalRequestAmount = ZERO
        entity.withdrawalPermittedFrom = ZERO
    }

    return entity as ServiceProvider
}

export function handleServiceProviderStakedBond(event: StakedServiceProviderBond): void {
    const serviceProviderContract = ServiceProviderContract.bind(event.address)

    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.isServiceProviderActive = true
    serviceProvider.rewardsProgrammeId = event.params.pid    
    serviceProvider.serviceProviderManager = event.params.serviceProviderManager
    serviceProvider.rewardsFeePercentage = serviceProviderContract.rewardsFeePercentage()
    serviceProvider.totalDelegatedStake = serviceProviderContract.delegatedStake(event.params.serviceProvider)
    serviceProvider.serviceProviderBond = BigInt.fromI32(2_000_000).times((BigInt.fromI32(10).pow(18))) // 2_000_000 * 10 ** 18
    serviceProvider.save()
}

export function handleStakeDelegatedToServiceProvider(event: AddDelegatedStake): void {
    let delegator = safeLoadDelegator(event.params.user, event.address)
    delegator.lastDelegationTxHash = event.transaction.hash
    delegator.delegatedStake = event.params.totalAmount

    delegator.save()

    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake.plus(event.params.amount)
    serviceProvider.save()
}

export function handleIncreasedServiceProviderBond(event: IncreasedServiceProviderBond): void {
    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.serviceProviderBond = event.params.totalAmount
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake.plus(event.params.amount)
    serviceProvider.save()
}

export function handleDecreasedServiceProviderBond(event: DecreasedServiceProviderBond): void {
    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.serviceProviderBond = event.params.totalAmount
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake.minus(event.params.amount)
    serviceProvider.withdrawalRequestAmount = serviceProvider.withdrawalRequestAmount.plus(event.params.amount)
    const serviceProviderContract = ServiceProviderContract.bind(event.address)
    serviceProvider.withdrawalPermittedFrom = serviceProviderContract.withdrawalRequest(event.params.serviceProvider).value0
    serviceProvider.save()
}

export function handleWithdrewServiceProviderStake(event: WithdrewDelegatedStake): void {
    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.withdrawalRequestAmount = ZERO
    serviceProvider.withdrawalPermittedFrom = ZERO
    serviceProvider.save()
}

export function handleExitedServiceProviderBond(event: ExitedServiceProviderBond): void {
    let serviceProvider = safeLoadServiceProvider(event.address.toHexString())
    serviceProvider.exited = true
    serviceProvider.isServiceProviderActive = false
    const serviceProviderContract = ServiceProviderContract.bind(event.address)
    serviceProvider.withdrawalPermittedFrom = serviceProviderContract.withdrawalRequest(event.params.serviceProvider).value0
    serviceProvider.withdrawalRequestAmount = serviceProvider.withdrawalRequestAmount.plus(serviceProvider.serviceProviderBond)
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake.minus(serviceProvider.serviceProviderBond)
    serviceProvider.serviceProviderBond = ZERO
    serviceProvider.save()
}

export function handleDelegatedStakeWithdrawalRequested(event: WithdrawDelegatedStakeRequested): void {
    let delegator = safeLoadDelegator(event.params.user, event.address)

    delegator.withdrawalRequested = true
    delegator.withdrawalRequestAmount = delegator.withdrawalRequestAmount.plus(event.params.amount)
    delegator.delegatedStake = delegator.delegatedStake.minus(event.params.amount)

    const serviceProviderContract = ServiceProviderContract.bind(event.address)
    delegator.withdrawalPermittedFrom = serviceProviderContract.withdrawalRequest(event.params.user).value0

    delegator.save()
}

export function handleDelegatedStakeWithdrawn(event: WithdrewDelegatedStake): void {
    handleDelegatedStakeWithdrawal(event.params.user, event.address, event.params.totalAmount, event.params.amount)
}

export function handleExitDelegatedStake(event: ExitDelegatedStake): void {
    handleDelegatedStakeWithdrawal(event.params.user, event.address, ZERO, event.params.amount)
}

function handleDelegatedStakeWithdrawal(user: Address, sp: Address, totalDelegated: BigInt, withdraw: BigInt): void {
    let delegator = safeLoadDelegator(user, sp)

    delegator.withdrawalRequested = false
    delegator.withdrawalRequestAmount = ZERO
    delegator.withdrawalPermittedFrom = ZERO

    delegator.delegatedStake = totalDelegated

    delegator.save()

    let serviceProvider = safeLoadServiceProvider(sp.toHexString())
    serviceProvider.totalDelegatedStake = serviceProvider.totalDelegatedStake.minus(withdraw)
    serviceProvider.save()
}
