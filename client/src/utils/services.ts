export const normalizeService = (service: string): string => {
  return service.toLowerCase().trim();
};

export const isServiceSelected = (
  service: string,
  selectedServices: string[]
): boolean => {
  const normalizedService = normalizeService(service);
  const normalizedSelected = selectedServices.map(normalizeService);
  return normalizedSelected.includes(normalizedService);
};

export const countValidSelectedServices = (
  selectedServices: string[],
  availableServices: string[]
): number => {
  const normalizedAvailable = availableServices.map(normalizeService);
  return selectedServices.filter((s) =>
    normalizedAvailable.includes(normalizeService(s))
  ).length;
};

export const updateServiceSelection = (
  service: string,
  currentServices: string[],
  checked: boolean
): string[] => {
  const normalizedService = normalizeService(service);

  let newServices: string[];
  if (checked) {
    newServices = [
      ...currentServices.filter(
        (s) => normalizeService(s) !== normalizedService
      ),
      service,
    ];
  } else {
    newServices = currentServices.filter(
      (s) => normalizeService(s) !== normalizedService
    );
  }

  return Array.from(new Set(newServices));
};
