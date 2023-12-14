export default (options) => {
  const issuers = {
    C: options.countryName,
    ST: options.stateName,
    L: options.locality,
    O: options.organization,
    OU: options.organizationalUnit,
    CN: options.commonName,
  };

  return Object
    .keys(issuers)
    .filter((key) => {
      const v = issuers[key];
      return v != null;
    })
    .map((key) => `/${key}=${issuers[key]}`)
    .join('');
};
