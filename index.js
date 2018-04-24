const fs = require('fs')
const path = require('path')

/**
 * 
 * @param {图片目录} imgPath 
 * @param {项目目录} projectPath 
 */
const imgLog = (imgPath, projectPath) => {
  return new Promise((resolve, reject) => {
    const listResult = []
    const time = Date.now()
    const extName = new RegExp('.(gif|jpe?g|png|svg|ico)$')//扩展名正则
  
    let count = 0
  
    /**
   * 遍历图片
   * @param {遍历图片根路径} url
   */
    function displayImg(url) {//遍历图片
      const files = fs.readdirSync(url)
      files.forEach(filename => {
        const list = []//每张图片的对比结果暂存
        const filedir = path.join(url, filename)
        const stats = fs.statSync(filedir)
        if (stats.isDirectory()) {//是目录
          displayImg(filedir)
        }
        else if (stats.isFile() && extName.test(filename)) {//是文件并且符合扩展名格式
          displayFile(projectPath, filename, list)
          const isExist = list.some(item => item.exist === true)
          listResult.push({//push最终结果
            id: count,
            name: list[0].name,
            imgDir: filedir,
            size: stats.size,
            exist: isExist,
            dir: list.filter(item => item.exist === true).map(item => item.dir)
          })
          count++
        }
        else {
          return
        }
      })
    }
  
    /**
     * 遍历项目文件
     * @param {遍历项目文件根路径} url
     * @param {图片文件名} img
     * @param {结果暂存list数组} list
     */
    function displayFile(url, img, list) {//遍历项目文件
      const files = fs.readdirSync(url)
      files.forEach(filename => {
        const filedir = path.join(url, filename);
        const stats = fs.statSync(filedir)
        if (stats.isDirectory()) {//递归遍历目录
          displayFile(filedir, img, list)
        }
        else if (stats.isFile() && extName.test(filename)) {//是文件并且符合扩展名跳过对比
          return
        }
        else {//是文件
          const data = fs.readFileSync(filedir)
          var patt = new RegExp(img);
          list.push({
            name: img,
            exist: patt.test(data.toString()), //对比图片是否存在于项目文件内
            dir: filedir
          })
        }
      })
    }
  
    displayImg(imgPath)//运行

    if (listResult.length === 0) {
      reject('Result null')
    }else{
      resolve(listResult)
      //写入log
      const logName = `img_log_${time}.log`//log文件名
      const logPath = path.join(process.cwd(), 'log')

      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath)
      }
      const writerStream = fs.createWriteStream(path.join(logPath ,logName))
      writerStream.write(JSON.stringify(listResult, null, "\t"), 'UTF8')
      writerStream.end()
      writerStream.on('finish', function () {
        console.log(`${logName} 写入完成。`)
        console.log(`用时${(Date.now() - time) / 1000}秒`)
      })
      writerStream.on('error', function (err) {
        console.log(err.stack)
      })
    }
  })
}

module.exports = imgLog;
