function isDataExists(existingData, newData) {
  const id = newData.id;
  return existingData.some((item) => item.id === id);
}

module.exports = { isDataExists };
