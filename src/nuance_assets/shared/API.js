import axios from "axios";

const API = {
  Get: (url, bearerAccessToken) => {
      return axios.get(url, {
        headers: { Authorization: `Bearer ${bearerAccessToken}` },
      });
  },

  Post: (url, data, bearerAccessToken) => {
    return axios({
      method: "POST",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${bearerAccessToken}`,
      },
    });
  },

  Patch: (url, data, bearerAccessToken) => {
    return axios({
      method: "PATCH",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${bearerAccessToken}`,
      },
    });
  },

  Put: (url, data, bearerAccessToken) => {
    return axios({
      method: "PUT",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${bearerAccessToken}`,
      },
    });
  },

  Submit: (method, url, data, bearerAccessToken) => {
    return axios({
      method: method,
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${bearerAccessToken}`,
      },
    });
  },


  Delete: (url, data, bearerAccessToken) => {
    return axios({
      method: "DELETE",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${bearerAccessToken}`,
      },
    });
  },
};

export default API;