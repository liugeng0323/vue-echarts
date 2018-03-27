let app = new Vue({
    el: "#container",
    data: {
        myChart: '',//echarts对象
        data:{},//存放原始的json对象
        dataObj: {},//优化json数据
        targetName: "",
        nameList: [],
        selectedFlag:0,
        selectedLineName:'',
        isShow:false

    },
    methods: {

        makeChart: function (yAxisData) {
            let enableData;let disableData;
            if (this.selectedFlag === 1) {//1:enable数据
                enableData = arguments[1] ? arguments[1] : '';
            }

            if (this.selectedFlag === 2) {//2:disable数据
                disableData = arguments[1] ? arguments[1] : '';
            }

            if (this.selectedFlag === 0) {//0:所有数据
                enableData = arguments[1] ? arguments[1] : '';
                disableData = arguments[2] ? arguments[2] : '';
            }
            let option = {
                dataZoom: [
                    {
                        id: 'dataZoomY',
                        type: 'slider',
                        yAxisIndex: [0],
                        filterMode: 'filter'
                    }
                ],
                title: {
                    text: '重要性排序'
                },
                tooltip: {},
                legend: {
                    data: ['可控', '不可控']
                },
                xAxis: {type: 'value'},
                yAxis: {
                    data: yAxisData,
                    type: 'category',
                    triggerEvent: true,
                },
                series: [{
                    name: '可控',
                    type: 'bar',
                    stack: '总量',
                    color: '#dd6b66',
                    barGap: '-100%',
                    data: enableData
                }, {
                    name: '不可控',
                    type: 'bar',
                    stack: '总量',
                    color: '#37A2DA',
                    barGap: '-100%',
                    data: disableData
                },
                    {
                        type: "line",
                        name: "当前选择",
                        markLine: {
                            silent: true,
                            data: [
                                {
                                    yAxis: this.selectedLineName
                                }
                            ]
                        }
                    },
                ]
            };
            this.myChart.setOption(option);
        },
        handleData(data) {
            let enableDataName = [];//可控数据的名称
            let enableData = [];//可控数据
            let disableDataName = [];//不可控数据的名称
            let disableData = [];//不可控数据
            let allDataName = [];//所有数据对应的名称
            let allDataOfEnable = [];//所有enable数据，disable数据用-字符
            let allDataOfDisable = [];
            for (let i = 0; i < data['charts'].length; i++) {
                allDataName.push(data['charts'][i]['name']);
                if (data['charts'][i]['ignored'] === 'ENABLE') {
                    enableDataName.push(data['charts'][i]['name']);
                    enableData.push(data['charts'][i]['gains']);
                    allDataOfEnable.push(data['charts'][i]['gains']);
                    allDataOfDisable.push("-");
                } else if (data['charts'][i]['ignored'] === 'DISABLE') {
                    disableDataName.push(data['charts'][i]['name']);
                    disableData.push(data['charts'][i]['gains']);
                    allDataOfEnable.push("-");
                    allDataOfDisable.push(data['charts'][i]['gains']);
                }

            }
            this.dataObj['enableDataName']=enableDataName;
            this.dataObj['enableData']=enableData;
            this.dataObj['disableDataName']=disableDataName;
            this.dataObj['disableData']=disableData;
            this.dataObj['allDataName']=allDataName;
            this.dataObj['allDataOfEnable']=allDataOfEnable;
            this.dataObj['allDataOfDisable']=allDataOfDisable;
        },
        changeValueOrLine(data) {// lineName可选参数
            let self = this;
            let lineName = arguments[1]?arguments[1]:self.selectedLineName;
            self.selectedLineName=lineName;
            if (self.selectedFlag === 0) {
                self.makeChart(this.dataObj['allDataName'], this.dataObj['allDataOfEnable'], this.dataObj['allDataOfDisable'], lineName);
            }
            if (self.selectedFlag === 1) {
                self.makeChart(this.dataObj['enableDataName'], this.dataObj['enableData'], lineName);
            }
            if (self.selectedFlag === 2) {
                self.makeChart(this.dataObj['disableDataName'], this.dataObj['disableData'], lineName);
            }
        },
        init() {
            let self = this;
            axios.get('data/test.json').then(function (response) {

                let jsonData = response.data;
                self.data = jsonData;
                self.handleData(jsonData);//dataObj赋值
                if (self.selectedLineName === '') {
                    self.selectedLineName = self.dataObj['allDataName'][0];
                }
                self.makeChart(self.dataObj['allDataName'], self.dataObj['allDataOfEnable'], self.dataObj['allDataOfDisable']);
                self.myChart.on('legendselectchanged', function (params) {

                    if (params.selected["可控"] === true && params.selected["不可控"] === false) {
                        self.selectedFlag = 1;

                        if (self.dataObj['enableDataName'].indexOf(self.selectedLineName) === -1) {
                            self.selectedLineName = self.dataObj['enableDataName'][0];
                        }
                        self.makeChart(self.dataObj['enableDataName'], self.dataObj['enableData']);

                    }
                    if (params.selected["可控"] === false && params.selected["不可控"] === true) {

                        self.selectedFlag = 2;
                        if (self.dataObj['disableDataName'].indexOf(self.selectedLineName) === -1) {
                            self.selectedLineName = self.dataObj['disableDataName'][0];
                        }
                        self.makeChart(self.dataObj['disableDataName'], self.dataObj['disableData']);
                    }
                    if (params.selected["可控"] === true && params.selected["不可控"] === true) {

                        self.selectedFlag = 0;

                        self.makeChart(self.dataObj['allDataName'], self.dataObj['allDataOfEnable'], self.dataObj['allDataOfDisable']);
                    }
                    if (params.selected["可控"] === false && params.selected["不可控"] === false) {

                        self.selectedFlag = 3;
                        self.selectedLineName = '';
                        self.makeChart(['无数据']);
                    }
                });

                self.myChart.on('click', function (params) {
                    if (params.yAxisIndex !== 0) {//点击柱体

                        self.selectedLineName = params.name;
                        self.changeValueOrLine(self.handleData(jsonData), params.name);

                    }

                    if (params.yAxisIndex === 0) {//y轴文本的点击事件

                        for (let i = 0; i < jsonData['charts'].length; i++) {
                            if (params.value === jsonData['charts'][i]['name']) {

                                if (jsonData['charts'][i]['ignored'] === 'ENABLE') {
                                    jsonData['charts'][i]['ignored'] = 'DISABLE';
                                } else {
                                    jsonData['charts'][i]['ignored'] = 'ENABLE';
                                }

                                console.log('当前改变的数据id为' + jsonData['charts'][i]['id'] + ', 改变后的ignored值为 ' + jsonData['charts'][i]['ignored']);
                            }
                            self.changeValueOrLine(self.handleData(jsonData));//此时更改了json的值，所以需重新构建dataObj对象
                        }

                    }
                });

            });
        },
        isMatch(str, arr) {//根据输入的字符匹配字符串
            let strArr = str.split('');//输入的字符
            let goodStr = [];//满足条件的字符串
            for (let i = 0; i < arr.length; i++) {//循环总的数组
                let eachArr = arr[i].split('');
                let _flag;//是否符合条件,0:不符合,1:符合
                for (let j = 0; j < strArr.length; j++) {
                    if (strArr[j] === eachArr[j]) {
                        _flag = 1;
                    } else {
                        _flag = 0;
                        break;//清除不符合条件的数据
                    }
                }
                if (_flag === 1) {
                    goodStr.push(arr[i]);
                    //console.log('goodStr');
                    console.log(goodStr);
                }
            }
            return goodStr;
        },
        showChartBySearch(name){
            this.isShow = false;//隐藏搜索框
            let enableData = [];
            let disableData = [];
            let dataobj = this.data;
            let dataName = [];
            dataName.push(name);
            for (let i = 0; i < dataobj['charts'].length; i++) {
                if (name === dataobj['charts'][i]['name']) { // 名称匹配
                    if (dataobj['charts'][i]['ignored'] === 'ENABLE') {
                        enableData.push(dataobj['charts'][i]['gains'])
                    } else {
                        disableData.push(dataobj['charts'][i]['gains'])
                    }
                }
            }
            this.selectedLineName = name;
            this.makeChart(dataName, enableData, disableData);
            this.targetName = '' // 清空搜索条件
        }
    },

    watch: {
        targetName: function () {//targetName变化时监听函数
            this.nameList = [];// 初始化字符串，避免重复显示字符串
            if (this.selectedFlag === 0) {
                this.nameList = this.isMatch(this.targetName, this.dataObj['allDataName']);
            }
            if (this.selectedFlag === 1) {
                this.nameList = this.isMatch(this.targetName, this.dataObj['enableDataName']);
            }
            if (this.selectedFlag === 2) {
                console.log(this.dataObj['disableDataName']);
                this.nameList = this.isMatch(this.targetName, this.dataObj['disableDataName']);
            }
            if (this.selectedFlag === 3) {
                this.nameList = this.isMatch(this.targetName, [''])
            }
        }
    },
    //调用
    mounted() {
        this.$nextTick(function () {
            let dom = this.$refs.myChart;
            this.myChart = echarts.init(dom);
            this.init();
        })
    }
});