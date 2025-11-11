import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type {
  CurrentMembership,
  MembershipInfo,
  MembershipPlanTier,
} from "../types";

interface MembershipNumbers {
  radiusKm?: number | null;
  accessDelayHours?: number | null;
}

interface MembershipMetrics {
  radiusLabel: string;
  delayLabel: string;
  radiusKm?: number | null;
  accessDelayHours?: number | null;
}

const FALLBACK_LABELS: MembershipMetrics = {
  radiusLabel: "—",
  delayLabel: "None",
  radiusKm: null,
  accessDelayHours: null,
};

const TIER_FALLBACKS: Partial<Record<MembershipPlanTier, MembershipNumbers>> = {
  basic: { radiusKm: 25, accessDelayHours: 24 },
  standard: { radiusKm: 75, accessDelayHours: 12 },
  premium: { radiusKm: Infinity, accessDelayHours: 0 },
};

const formatRadius = (value?: number | null): string => {
  if (value === undefined || value === null) {
    return FALLBACK_LABELS.radiusLabel;
  }

  if (!Number.isFinite(value)) {
    return "∞ km";
  }

  if (value <= 0) {
    return FALLBACK_LABELS.radiusLabel;
  }

  return `${value} km`;
};

const formatDelay = (value?: number | null): string => {
  if (value === undefined || value === null) {
    return FALLBACK_LABELS.delayLabel;
  }

  if (!Number.isFinite(value)) {
    return "∞";
  }

  if (value <= 0) {
    return FALLBACK_LABELS.delayLabel;
  }

  if (value === 1) {
    return "1 hour";
  }

  return `${value} hours`;
};

const extractFromFeatures = (
  features: string[] | undefined
): MembershipNumbers => {
  if (!features || features.length === 0) {
    return {};
  }

  let radiusKm: number | undefined;
  let accessDelayHours: number | undefined;

  features.forEach((feature) => {
    if (!radiusKm) {
      if (/unlimited/i.test(feature) && /radius|distance/i.test(feature)) {
        radiusKm = Infinity;
      } else {
        const radiusMatch = feature.match(
          /(\d+(?:\.\d+)?)\s*(?:km|kilometers?|kilometres?)/i
        );
        if (radiusMatch) {
          radiusKm = Number(radiusMatch[1]);
        }
      }
    }

    if (accessDelayHours === undefined) {
      if (/instant|immediate/i.test(feature) && /access/i.test(feature)) {
        accessDelayHours = 0;
      } else {
        const delayMatch = feature.match(
          /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i
        );
        if (delayMatch) {
          accessDelayHours = Number(delayMatch[1]);
        }
      }
    }
  });

  return { radiusKm, accessDelayHours };
};

const deriveFromMembershipInfo = (
  info: MembershipInfo | null
): MembershipNumbers => {
  if (!info) {
    return {};
  }

  return {
    radiusKm: info.radiusKm,
    accessDelayHours: info.accessDelayHours,
  };
};

const deriveFromCurrentMembership = (
  current: CurrentMembership | null
): MembershipNumbers => {
  if (!current) {
    return {};
  }

  const featureNumbers = extractFromFeatures(current.planId?.features);
  if (
    featureNumbers.radiusKm !== undefined ||
    featureNumbers.accessDelayHours !== undefined
  ) {
    return featureNumbers;
  }

  const tierFallback =
    current.planId?.tier && TIER_FALLBACKS[current.planId.tier];

  return tierFallback || {};
};

export const useContractorMembershipMetrics = (): MembershipMetrics => {
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  );
  const contractorMembershipInfo = useSelector(
    (state: RootState) => state.contractorJob.membershipInfo
  );

  return useMemo(() => {
    const fromInfo = deriveFromMembershipInfo(contractorMembershipInfo);
    const fromCurrent = deriveFromCurrentMembership(
      currentMembership as CurrentMembership | null
    );

    const radiusKm =
      fromInfo.radiusKm ?? fromCurrent.radiusKm ?? FALLBACK_LABELS.radiusKm;
    const accessDelayHours =
      fromInfo.accessDelayHours ??
      fromCurrent.accessDelayHours ??
      FALLBACK_LABELS.accessDelayHours;

    return {
      radiusLabel: formatRadius(radiusKm),
      delayLabel: formatDelay(accessDelayHours),
      radiusKm,
      accessDelayHours,
    };
  }, [contractorMembershipInfo, currentMembership]);
};

export default useContractorMembershipMetrics;
