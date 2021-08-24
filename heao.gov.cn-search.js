// ==UserScript==
// @name         河南省2021年普通高等学校招生考试成绩查询（含对口生和专升本） 油猴脚本
// @namespace    https://github.com/mengyou658/heao.gov.cn-search
// @version      1.0.0
// @description  查询河南省2021年普通高等学校招生考试成绩查询（含对口生和专升本） 油猴脚本
// @author       yunchaoq/mengyou658
// @license      GPL License
// @match        *://*.heao.gov.cn/*
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/layer/3.1.1/layer.min.js
// @resource     layerCss https://cdn.bootcdn.net/ajax/libs/layer/3.1.1/theme/default/layer.min.css
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getResourceText
// ==/UserScript==
(function () {
  'use strict';
  GM_addStyle(GM_getResourceText('layerCss'))
  // GM_addStyle(GM_getResourceText('layuiCss'))
  var location = window.location.href;
  // 首页
  let homePageFlag = location.indexOf("http://www.heao.gov.cn/HEAODataCenter/PagePZQuery") > -1 ;
  if (homePageFlag) {
    init();
  }

  // insertScript('https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js')
  function init() {

    if (homePageFlag) {
      // 首页
      homePageInit();
    }

  }

  function homePageInit() {
    showMsg('查询页面')
    // 首页
    $('#bmxhradio').attr("checked", true);
    showModal()
  }

  function showModal() {
    $('#InputCheck').prop('autocomplete', 'off')
    $('#QueryBtn').val('查询（CTRL+SHIFT+A）')
    $("body").keydown(function (e) {
      if (e.ctrlKey && e.shiftKey && e.keyCode == 32)
      {
        toNext()
      } else if (e.ctrlKey && e.shiftKey && e.keyCode == 65) {
        $('#QueryBtn').click()
      }
    });
    var tmp = getInitData()
    var data = tmp.data
    var dataState = tmp.dataState
    var prevData = (data && dataState && dataState.index > 0 ? data[dataState.index-1]['姓名']+ '('+data[dataState.index-1]['考生号']+')' : '')
    var currData = (data && dataState && dataState.index < data.length ? data[dataState.index]['姓名']+ '('+data[dataState.index]['考生号']+')' : '')
    var nextData = (data && dataState && dataState.index < data.length - 1 ? data[dataState.index+1]['姓名']+ '('+data[dataState.index+1]['考生号']+')' : '')
    layer.confirm('上一个数据：' + prevData +'<br/>当前查询数据: ' + currData + '<br/>下一个数据: ' + nextData, {
      title: '操作',
      btn: ['从头开始', '上一个', '下一个(CTRL+SHIFT+空格)', '继续当前', '保存当前', '下载结果'] //可以无限个按钮
          ,closeBtn: 0, shade: 0, offset: 'rt'
      ,btn1: function(index1, layero){
        //从头开始
        var tmp = getInitData()
        var data = tmp.data
        var dataState = tmp.dataState
        if (!data || !data.length) {
          showMsg('等待获取数据，请设置localStorage.setItem("tmpSearchCsvData",[{"考生号":"xxx","报名序号":"xxx","班级":"xxx","姓名":"xxxx","语文":"","数学":"","外语":"","综合":"","总分":"0"},])')
          return;
        }
        dataState = {
          index: 0,
          searchCount: 0,
          state: 1
        }
        localStorage.setItem("tmpSearchCsvDataState", JSON.stringify(dataState));
        startSearch(data[dataState.index])
        showModal()
      },btn2: function(index1, layero){
        //上一个
        toPrev()
      },btn3: function(index1, layero){
        //下一个
        toNext()
      }
      ,btn4: function(index1, layero){
        //继续当前
        toCurrent()
      }
      ,btn5: function(index1, layero){
        //保存当前
        saveData()
        showModal()
      }
      ,btn6: function(index1, layero){
        //下载数据
        download()
        showModal()
      }
    })
  }

  function toCurrent() {
    var tmp = getInitData()
    var data = tmp.data
    var dataState = tmp.dataState
    if (!data || !data.length) {
      showMsg('等待获取数据，请设置localStorage.setItem("tmpSearchCsvData",[{"考生号":"xxx","报名序号":"xxx","班级":"xxx","姓名":"xxxx","语文":"","数学":"","外语":"","综合":"","总分":"0"},])')
      showModal()
      return;
    }
    if (dataState && dataState.index > data.length - 1) {
      showMsg("当前是最后一个数据")
      showModal()
      return;
    }
    startSearch(data[dataState.index])
    showModal()
  }

  function toNext() {
    var tmp = getInitData()
    var data = tmp.data
    var dataState = tmp.dataState
    if (!data || !data.length) {
      showMsg('等待获取数据，请设置localStorage.setItem("tmpSearchCsvData",[{"考生号":"xxx","报名序号":"xxx","班级":"xxx","姓名":"xxxx","语文":"","数学":"","外语":"","综合":"","总分":"0"},])')
      showModal()
      return;
    }
    saveData()
    if (dataState && dataState.index >= data.length - 1) {
      showMsg("当前是最后一个数据，")
      showModal()
      return;
    }
    dataState.index += 1
    localStorage.setItem("tmpSearchCsvDataState", JSON.stringify(dataState));
    startSearch(data[dataState.index])
    showModal()
  }

  function toPrev() {
    var tmp = getInitData()
    var data = tmp.data
    var dataState = tmp.dataState
    if (!data || !data.length) {
      showMsg('等待获取数据，请设置localStorage.setItem("tmpSearchCsvData",[{"考生号":"xxx","报名序号":"xxx","班级":"xxx","姓名":"xxxx","语文":"","数学":"","外语":"","综合":"","总分":"0"},])')
      showModal()
      return;
    }
    saveData()
    if (dataState && dataState.index <= 1) {
      showMsg("当前是第一个数据")
      showModal()
      return;
    }
    dataState.index -= 1
    localStorage.setItem("tmpSearchCsvDataState", JSON.stringify(dataState));
    startSearch(data[dataState.index])
    showModal()
  }

  function saveData() {
    var tabInfo = $('#tabInfo')
    if (tabInfo && tabInfo.length) {
      var res = []
      tabInfo.find('td:odd').each(function () {
        res.push($(this).text())
      });
      var tmp = getInitData()
      var data = tmp.data
      var dataState = tmp.dataState
      if (data && dataState && dataState.index < data.length) {
        let datum = data[dataState.index];
        if (datum['姓名'] != res[1]) {
          showInfoMsg("保存失败，当前查询数据不对应")
          return false
        }
        datum.scores = res;
        localStorage.setItem("tmpSearchCsvData", JSON.stringify(data));
        showInfoMsg("保存成功")

        return true
      }
    } else {
      showInfoMsg("当前没有查询到数据，无法保存")
      return false
    }
  }

  function getInitData() {
    var data = localStorage.getItem("tmpSearchCsvData")
    if (data) {
      try {
        data = JSON.parse(data)
      } catch (e) {
        data = null
      }
    }
    var dataState = localStorage.getItem("tmpSearchCsvDataState")
    if (dataState) {
      try {
        dataState = JSON.parse(dataState)
      } catch (e) {
        dataState = null
      }
    }
    return {data, dataState}
  }

  function startSearch(item) {
    $('#bmxhradio').click()
    $('#bmxhradio').attr('checked', true);
    if (!item['考生号'] || !item['报名序号']) {
      var dataState = localStorage.getItem("tmpSearchCsvDataState")
      dataState.index += 1
      dataState.state = 0
      localStorage.setItem("tmpSearchCsvDataState", JSON.stringify(dataState))
      return
    }
    showMsg("当前查询数据："+item['姓名']+"，请输入验证码")
    $('#ksh').val(item['考生号']);
    $('#ksh').prop('autocomplete', 'off')
    $('#sfzh').val(item['报名序号']);
    $('#sfzh').prop('autocomplete', 'off')
    $('#CheckPic').click();
    $('#InputCheck').focus();
  }

  function download() {
    var data = localStorage.getItem("tmpSearchCsvData")
    if (data) {
      try {
        data = JSON.parse(data)
      } catch (e) {
        data = null
      }
    }
    if (!data) {
      showMsg("当前没有数据，无法下载");
      return
    }
    var res = ['考生号,报名序号,班级,姓名,语文,数学,外语,综合,总分']
    for (var i in data) {
      var item = data[i]
      var tmp = []
      if (!item['考生号']) {
        continue
      }
      tmp.push(item['考生号']);
      tmp.push(item['报名序号'])
      tmp.push(item['班级'])
      tmp.push(item['姓名'])
      if (item.scores) {
        tmp.push(item.scores[4])
        tmp.push(item.scores[5])
        tmp.push(item.scores[6])
        tmp.push(item.scores[7])
        tmp.push(item.scores[9])
      }
      res.push(tmp.join(','))
    }
    console.log('currentData download', res)
    downloadCsv(res.join('\r\n'));
  }

  function showMsg(msg, callback) {
    console.log(msg)
    layer.msg(msg, callback)
  }

  function showInfoMsg(msg, className) {
    console.log(msg)
    var msgTmpData = $('#msgTmpData')
    if (!msgTmpData || !msgTmpData.length) {
      $('#QueryBtn').parent().append('<p id="msgTmpData" style="color: red;">'+msg+'</p>')
    }
    $('#msgTmpData').text(msg)
  }

  function downloadCsv(data) {
    var str = data;
    var blob = new Blob([str], {type: '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'});
    const url3 = window.URL.createObjectURL(blob);

    var filename = '高考查询结果-' + new Date().getTime() + '.csv';
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url3;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
  }

  function insertScript(src) {
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = src;
    document.body.appendChild(newScript);
  }
})();
