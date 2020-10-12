"use strict";

var Service, Characteristic, HomebridgeAPI;
const PLUGIN_NAME = 'homebridge-rtsp-recorder';
const PLUGIN_ACCESSORY = 'RTSPRecorder'
const Recorder = require('rtsp-video-recorder').Recorder

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(PLUGIN_ACCESSORY, RTSPSwitch);
}

class RTSPSwitch {
  constructor (log, config) {
      this.log = log
      this.config = config

      this.name = config.name;
      this.directory = config.directory;
      this.cameraName = config.cameraName || this.switchName;
      this.cameraURL = config.cameraURL;
      this.interval = config.interval;
      this.directoryFormat = config.directoryFormat;
      this.fileNameFormat = config.fileNameFormat;

      this.model = config.model || 'RTSP Recorder';
      this.manufacturer = config.manufacturer || 'jcbshw';
      this.serial = config.serial || '1.0';

      if (this.cameraURL == null) {
        this.log.warn("Camera RTSP URL is missing for " + this.name)
      } else if (this.directory == null) {
        this.log.warn("Recording directory is missing for " + this.name)
      }

      this.service = new Service.Switch(this.name)
  }

  getServices () {
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
        .setCharacteristic(Characteristic.Model, this.model)
        .setCharacteristic(Characteristic.SerialNumber, this.serial)
    this.service.getCharacteristic(Characteristic.On)
      .on('get', this.getOnCharacteristicHandler.bind(this))
      .on('set', this.setOnCharacteristicHandler.bind(this))
    return [informationService, this.service]
  }

  setOnCharacteristicHandler (value, callback) {
    this.isOn = value
    if (value) {
      this.log.info('Recording from ' + this.config.name + ' starting')
      this.rec = null
      this.rec = new Recorder(this.cameraURL, this.directory, {
          title: this.cameraName,
          segmentTime: this.interval,
          filePatter: this.fileNameFormat,
      })
      this.rec.startRecording()
    } else if (this.rec != null) {
        this.log.info('Recording from ' + this.config.name + ' ending')
        this.rec.stopRecording()
        this.rec = null
    }
    callback(null)
  }

  getOnCharacteristicHandler (callback) {
    callback(null, this.isOn)
  }
}