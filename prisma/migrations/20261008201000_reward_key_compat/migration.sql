ALTER TABLE "LoyaltyEntry" ALTER COLUMN "rewardKey" SET DEFAULT gen_random_uuid()::text;
