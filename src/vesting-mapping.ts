import {
    DrawDown, ScheduleCreated
} from "../generated/VestingContract/VestingContract";

import {VestingDrawDown, VestingBeneficiary, VestingSummary} from "../generated/schema";

import {toEther, ZERO_BIG_DECIMAL} from "./helpers";

export function handleScheduleCreated(event: ScheduleCreated): void {

    // beneficiary
    let vestingBeneficiaryEntity = VestingBeneficiary.load(event.params._beneficiary.toHexString());

    if (vestingBeneficiaryEntity === null) {
        vestingBeneficiaryEntity = new VestingBeneficiary(event.params._beneficiary.toHexString());
        vestingBeneficiaryEntity.beneficiary = event.params._beneficiary;
        vestingBeneficiaryEntity.totalAmountVested = toEther(event.params._amount);
        vestingBeneficiaryEntity.start = event.params._start;
        vestingBeneficiaryEntity.duration = event.params._duration;
        vestingBeneficiaryEntity.totalAmountDrawnDown = ZERO_BIG_DECIMAL;
    }

    vestingBeneficiaryEntity.totalAmountDrawnDown = vestingBeneficiaryEntity.totalAmountDrawnDown.plus(toEther(event.params._amount));
    vestingBeneficiaryEntity.save();

    // summary
    let vestingSummaryEntity = VestingSummary.load("summary-vesting");

    if (vestingSummaryEntity === null) {
        vestingSummaryEntity = new VestingSummary("summary-vesting");
        vestingSummaryEntity.totalAmountVested = ZERO_BIG_DECIMAL;
        vestingSummaryEntity.totalAmountDrawnDown = ZERO_BIG_DECIMAL;
    }

    vestingSummaryEntity.totalAmountVested = vestingSummaryEntity.totalAmountVested.plus(toEther(event.params._amount));

    vestingSummaryEntity.save();
}

export function handleDrawDown(event: DrawDown): void {
    let drawDownId = "dd-"
        .concat(event.params._beneficiary.toHexString())
        .concat("-")
        .concat(event.params._amount.toString())
        .concat("-")
        .concat(event.params._time.toString())
        .concat("-")
        .concat(event.block.number.toString());

    let drawDownEntity = new VestingDrawDown(drawDownId);

    drawDownEntity.beneficiary = event.params._beneficiary;
    drawDownEntity.amount = toEther(event.params._amount);
    drawDownEntity.timestamp = event.params._time;

    drawDownEntity.save();

    // beneficiary
    let vestingBeneficiaryEntity = VestingBeneficiary.load(event.params._beneficiary.toHexString());
    vestingBeneficiaryEntity.totalAmountDrawnDown = vestingBeneficiaryEntity.totalAmountDrawnDown.plus(toEther(event.params._amount));
    vestingBeneficiaryEntity.save();

    // summary
    let vestingSummaryEntity = VestingSummary.load("summary-vesting");
    vestingSummaryEntity.totalAmountDrawnDown = vestingSummaryEntity.totalAmountDrawnDown.plus(toEther(event.params._amount));
    vestingSummaryEntity.save();
}
