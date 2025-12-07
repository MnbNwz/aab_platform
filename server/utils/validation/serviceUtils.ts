export function normalizeService(service: string): string {
  if (!service || typeof service !== "string") {
    return "";
  }
  return service.trim().toLowerCase();
}

export function normalizeServices(services: string[]): string[] {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return [];
  }

  const normalized = new Array<string>(services.length);
  for (let i = 0; i < services.length; i++) {
    normalized[i] = normalizeService(services[i]);
  }
  return normalized;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createServiceRegexQuery(service: string): { $regex: RegExp } {
  const normalized = normalizeService(service);
  return {
    $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i"),
  };
}

function createServiceRegexQueryFromNormalized(normalizedService: string): { $regex: RegExp } {
  return {
    $regex: new RegExp(`^${escapeRegex(normalizedService)}$`, "i"),
  };
}

export function createServiceOrQuery(
  services: string[],
): { $or: Array<{ service: { $regex: RegExp } }> } | null {
  if (!services || services.length === 0) {
    return null;
  }

  const normalized = normalizeServices(services);
  const orConditions = new Array<{ service: { $regex: RegExp } }>(normalized.length);

  for (let i = 0; i < normalized.length; i++) {
    orConditions[i] = {
      service: createServiceRegexQueryFromNormalized(normalized[i]),
    };
  }

  return { $or: orConditions };
}

export function isValidService(service: string, availableServices: string[]): boolean {
  if (!service || !availableServices || availableServices.length === 0) {
    return false;
  }

  const normalizedService = normalizeService(service);
  const availableSet = new Set(normalizeServices(availableServices));
  return availableSet.has(normalizedService);
}

export function filterValidServicesWithNormalized(
  normalizedServices: string[],
  normalizedAvailableServices: string[],
): string[] {
  if (
    !normalizedServices ||
    normalizedServices.length === 0 ||
    !normalizedAvailableServices ||
    normalizedAvailableServices.length === 0
  ) {
    return [];
  }

  const availableSet = new Set(normalizedAvailableServices);
  const inputSet = new Set(normalizedServices);
  return Array.from(inputSet).filter((service) => availableSet.has(service));
}
