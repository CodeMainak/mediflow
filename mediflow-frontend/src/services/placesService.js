import api from "./api";

export const savePlace = (place) => api.post("/api/places/saved", place);
export const getSavedPlaces = () => api.get("/api/places/saved");
export const deleteSavedPlace = (id) => api.delete(`/api/places/saved/${id}`);
