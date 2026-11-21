var DOOR_FNS = {
  checkName: checkName,
  registerStaff: registerStaff,
  changePassword: changePassword,
  createPassword: createPassword,
  enterDay: enterDay,
  listCatalog: listCatalog,
  loadDay: loadDay,
  saveDay: saveDay,
  addPlace: addPlace,
  addVehicle: addVehicle,
  addStaff: addStaff,
  setStaffPassword: setStaffPassword
};

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var fn = body && DOOR_FNS[body.fn];
    if (!body || body.door !== "geuntoe" || !fn) {
      return doorJson({ ok: false, message: "이 문은 아직 스크립트에 없습니다." });
    }
    return doorJson(fn.apply(null, body.args || []));
  } catch (error) {
    return doorJson({ ok: false, message: "연결이 되지 않았습니다. 다시 시도해 주세요." });
  }
}

function doorJson(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
