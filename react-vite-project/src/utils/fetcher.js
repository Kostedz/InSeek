import mergeHeaders from "./mergeheader";
import BASE_URL from "../components/config/Config.jsx";
async function fetcher(input, options) {
  const {skipAuth = false, ...requestOptions} = options ?? {};
  const token = skipAuth ? null : localStorage.getItem("token");
  const defaultHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const headers = mergeHeaders(defaultHeaders, requestOptions.headers);
  const fetchOptions = {...requestOptions, headers};
  const path = input.replace(/^\//, "");
  return fetch(`${BASE_URL}${path}`, fetchOptions);
}
export default fetcher;
