import mergeHeaders from "./mergeheader";
import BASE_URL from "../components/config/Config.jsx";
async function fetcher(input, options) {
  const {skipAuth = false, ...requestOptions} = options ?? {};
  const token = skipAuth ? null : localStorage.getItem("token");
  console.log("Token from localStorage:", token ? token.substring(0, 20) + "..." : "NO TOKEN");
  const defaultHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  console.log("Default headers:", defaultHeaders);

  const headers = mergeHeaders(defaultHeaders, requestOptions.headers);
  console.log("Merged headers:", headers);
  const fetchOptions = {...requestOptions, headers};
  try {
    input = input.replace(/^\//, '');
    const url = BASE_URL + input;
    console.log("Fetching:", url, "with options:", fetchOptions);
    const response = await fetch(`${BASE_URL}${input}`, fetchOptions);
    console.log("Response status:", response.status);
    return response;
  } catch(e) {
    throw e;
  }

}
export default fetcher;
