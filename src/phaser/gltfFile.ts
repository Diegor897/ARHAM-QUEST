import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Phaser from 'phaser'

export default class GltfFile extends Phaser.Loader.File {
  constructor(loader, key, url?, xhrSettings?, dataKey?) {
    var extension = 'json'

    if (Phaser.Utils.Objects.IsPlainObject(key))
    {
        var config = key

        key = Phaser.Utils.Objects.GetFastValue(config, 'key')
        url = Phaser.Utils.Objects.GetFastValue(config, 'url')
        xhrSettings = Phaser.Utils.Objects.GetFastValue(config, 'xhrSettings')
        extension = Phaser.Utils.Objects.GetFastValue(config, 'extension', extension)
        dataKey = Phaser.Utils.Objects.GetFastValue(config, 'dataKey', dataKey)
    }


    var fileConfig = {
        type: 'binary',
        cache: loader.cacheManager.addCustom("gltf"),
        extension: extension,
        responseType: 'arraybuffer' as XMLHttpRequestResponseType,
        key: key,
        url: url,
        xhrSettings: xhrSettings,
        config: dataKey
    }

    super(loader, fileConfig)
  }

  onProcess(): void {
    this.state = Phaser.Loader.FILE_PROCESSING
    var loader = new GLTFLoader()
    loader.parse(this.xhrLoader?.response, "", (gltf) => {
      this.data = gltf
      this.onProcessComplete()
    }, (event) => {
      this.onProcessError()
    })
  }
}

Phaser.Loader.FileTypesManager.register('gltf', function (key, url, dataType, xhrSettings) {
  if (Array.isArray(key)) {
    for (let i = 0; i < key.length; i++) {
      // If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
      this.addFile(new GltfFile(this, key[i]))
    }
  } else {
    this.addFile(new GltfFile(this, key, url, xhrSettings, dataType))
  }

  return this
})