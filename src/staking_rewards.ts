import { ServiceProvider } from '../generated/templates'
import {ServiceProviderWhitelisted} from "../generated/ServiceProvider/StakingRewards";

export function handleNewServiceProviderWhitelisted(event: ServiceProviderWhitelisted): void {
    // Start indexing the exchange; `event.params.exchange` is the
    // address of the new exchange contract
    ServiceProvider.create(event.params.serviceProvider)
}
