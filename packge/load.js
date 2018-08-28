// 按顺序加载js
// 当顺序排列完成，再依次执行文件
// setObj: catch{Boolen} 是否去掉缓存

function $load(setObj) {
  if (setObj && setObj.catch === false) {
    this.catch = setObj.catch;
  } else {
    this.catch = true;
  }
  console.log(this.catch);
  this.scriptList = [];
  var _this = this;
  this.time = null;
  this.init = function () {
    // 分割排序列表
    function splitList(list) {
      var __list = [];
      if (!list.length) {
        return [];
      } else if (!list.find(function (v) {
        return v.wait;
      })) {
        return [list];
      } else {
        while (1) {
          if (list[0].wait) {
            __list.push(list.shift());
            break;
          } else {
            __list.push(list.shift());
          }
        }
        return [__list].concat(splitList(list));
      }
    }
    var _splitResult = splitList(_this.scriptList);
    loadScript(_splitResult);
    // 根据分割结果嵌套加载以及执行顺序
    function loadScript(scriptList) {
      var tempScript = scriptList.shift();
      var __wait = tempScript[tempScript.length - 1].wait || true;
      tempScript.forEach(function (v) {
        document.body.appendChild(v.script);
        if (v.script.readyState) {
          v.script.onreadystatechange = function () {
            if (v.script.readyState == "loaded" || v.script.readyState == "complete") {
              v.script.onreadystatechange = null;
              v.load = true;
              if (tempScript.filter(function (val) {
                return val.load;
              }).length == tempScript.length) {
                if (__wait instanceof Function) {
                  __wait();
                }
                // 如果还有未加载部分
                if (scriptList.length) {
                  loadScript(scriptList);
                }
              }
            }
          }
        } else {
          v.script.onload = function () {
            v.load = true;
            if (tempScript.filter(function (val) {
              return val.load;
            }).length == tempScript.length) {
              if (__wait instanceof Function) {
                __wait();
              }
              // 如果还有未加载部分
              if (scriptList.length) {
                loadScript(scriptList);
              }
            }
          }
        }
      })
    }
  }
  this.load = function (jsObj) {
    // 单个加载js
    if (typeof jsObj == 'string') {
      var _catchNum = '';
      if (!_this.catch) {
        // 如果存在相同js,则复制版本号
        if (_this.scriptList.find(function (v) {
          return v.url == jsObj;
        })) {
          _catchNum = _this.scriptList.find(function (v) {
            return v.url == jsObj;
          }).catch;
        } else {
          _catchNum = Date.now() + '=';
        }
      }
      _this.scriptList.push({ script: loadJs(jsObj + '?' + _catchNum), load: false, url: jsObj, catch: _catchNum });
      // 批量加载js
    } else if (jsObj instanceof Array) {
      jsObj.forEach(function (v) {
        var _catchNum = '';
        if (!_this.catch) {
          // 如果存在相同js,则复制版本号
          if (_this.scriptList.find(function (val) {
            return val.url == v;
          })) {
            _catchNum = _this.scriptList.find(function (val) {
              return val.url == v;
            }).catch;
          } else {
            _catchNum = Date.now() + '=';
          }
        }
        _this.scriptList.push({ script: loadJs(v + '?' + _catchNum), load: false, url: v, catch: _catchNum });
      })
    }
    if (_this.time) {
      clearTimeout(_this.time);
    }
    _this.time = setTimeout(function () {
      _this.init();
    }, 300);
    return this;
  }

  // 需要等待加载前面的js加载完成执行
  this.wait = function (func) {
    _this.scriptList[_this.scriptList.length - 1].wait = func || true;
    if (_this.time) {
      clearTimeout(_this.time);
    }
    _this.time = setTimeout(function () {
      _this.init();
    }, 300);
    return this;
  }
}

function loadJs(url) {
  var script = document.createElement('script');
  script.type = "text/javascript";
  script.src = url;
  return script;
}