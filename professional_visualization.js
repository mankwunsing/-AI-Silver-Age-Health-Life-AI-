/**
 * 專業級數據可視化模塊
 * 實現雙軸折線圖、熱力圖、堆疊條形圖等專業圖表
 * 基於Chart.js和自定義算法
 */

class ProfessionalVisualization {
    constructor() {
        this.chartInstances = {};
        this.colorPalettes = {
            medical: {
                primary: '#2563eb',      // 藍色
                secondary: '#dc2626',    // 紅色
                success: '#16a34a',      // 綠色
                warning: '#ea580c',      // 橙色
                info: '#0891b2',         // 青色
                purple: '#7c3aed'        // 紫色
            },
            gradient: {
                blue: ['#3b82f6', '#1d4ed8', '#1e40af'],
                red: ['#ef4444', '#dc2626', '#b91c1c'],
                green: ['#22c55e', '#16a34a', '#15803d'],
                orange: ['#f97316', '#ea580c', '#c2410c']
            }
        };
        
        this.medicalStandards = {
            bloodPressure: {
                normal: { systolic: 120, diastolic: 80 },
                highNormal: { systolic: 130, diastolic: 85 },
                stage1: { systolic: 140, diastolic: 90 },
                stage2: { systolic: 160, diastolic: 100 },
                stage3: { systolic: 180, diastolic: 110 }
            },
            bloodOxygen: {
                normal: 95,
                mildHypoxemia: 90,
                severeHypoxemia: 85
            },
            temperature: {
                axillary: { min: 36.0, max: 37.2 },
                oral: { min: 36.3, max: 37.2 },
                rectal: { min: 36.6, max: 37.6 }
            },
            pulse: {
                normal: { min: 60, max: 100 },
                bradycardia: 50,
                tachycardia: 100
            }
        };
    }

    /**
     * 創建雙軸趨勢分析圖表
     * 左軸：血壓，右軸：脈搏
     */
    createDualAxisTrendChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        // 銷毀現有圖表
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: '血壓與脈搏同步變化趨勢',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return `時間: ${context[0].label}`;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const unit = context.dataset.unit || '';
                            return `${label}: ${value}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '時間'
                    },
                    type: 'time',
                    time: {
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'MM-dd',
                            week: 'MM-dd',
                            month: 'yyyy-MM'
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '血壓 (mmHg)',
                        color: this.colorPalettes.medical.primary
                    },
                    ticks: {
                        color: this.colorPalettes.medical.primary
                    },
                    grid: {
                        color: 'rgba(37, 99, 235, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '脈搏 (bpm)',
                        color: this.colorPalettes.medical.secondary
                    },
                    ticks: {
                        color: this.colorPalettes.medical.secondary
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(220, 38, 38, 0.1)'
                    }
                }
            }
        };

        const config = {
            type: 'line',
            data: this.prepareDualAxisData(data),
            options: { ...defaultOptions, ...options }
        };

        this.chartInstances[canvasId] = new Chart(ctx, config);
        return this.chartInstances[canvasId];
    }

    /**
     * 創建血氧飽和度面積圖
     */
    createBloodOxygenAreaChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        // 銷毀現有圖表
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '血氧飽和度波動範圍',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return `時間: ${context[0].label}`;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '時間'
                    },
                    type: 'time',
                    time: {
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'MM-dd',
                            week: 'MM-dd',
                            month: 'yyyy-MM'
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '血氧飽和度 (%)'
                    },
                    min: 85,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(22, 163, 74, 0.1)'
                    }
                }
            }
        };

        const config = {
            type: 'line',
            data: this.prepareBloodOxygenData(data),
            options: { ...defaultOptions, ...options }
        };

        this.chartInstances[canvasId] = new Chart(ctx, config);
        return this.chartInstances[canvasId];
    }

    /**
     * 創建體溫柱狀圖
     */
    createTemperatureBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        // 銷毀現有圖表
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '體溫每日均值',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return `日期: ${context[0].label}`;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value}°C`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期'
                    },
                    type: 'time',
                    time: {
                        displayFormats: {
                            day: 'MM-dd',
                            week: 'MM-dd',
                            month: 'yyyy-MM'
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '體溫 (°C)'
                    },
                    min: 35,
                    max: 38,
                    ticks: {
                        callback: function(value) {
                            return value + '°C';
                        }
                    },
                    grid: {
                        color: 'rgba(234, 88, 12, 0.1)'
                    }
                }
            }
        };

        const config = {
            type: 'bar',
            data: this.prepareTemperatureData(data),
            options: { ...defaultOptions, ...options }
        };

        this.chartInstances[canvasId] = new Chart(ctx, config);
        return this.chartInstances[canvasId];
    }

    /**
     * 創建相關性熱力圖
     */
    createCorrelationHeatmap(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        // 銷毀現有圖表
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '5項指標相關性強度熱力圖',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `相關性分析`;
                        },
                        label: function(context) {
                            const row = context.dataIndex;
                            const col = context.datasetIndex;
                            const value = context.parsed;
                            const labels = ['收縮壓', '舒張壓', '脈搏', '血氧', '體溫'];
                            return `${labels[row]} vs ${labels[col]}: ${value.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '健康指標'
                    },
                    ticks: {
                        callback: function(value, index) {
                            const labels = ['收縮壓', '舒張壓', '脈搏', '血氧', '體溫'];
                            return labels[index] || '';
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '健康指標'
                    },
                    ticks: {
                        callback: function(value, index) {
                            const labels = ['收縮壓', '舒張壓', '脈搏', '血氧', '體溫'];
                            return labels[index] || '';
                        }
                    }
                }
            }
        };

        const config = {
            type: 'scatter',
            data: this.prepareCorrelationData(data),
            options: { ...defaultOptions, ...options }
        };

        this.chartInstances[canvasId] = new Chart(ctx, config);
        return this.chartInstances[canvasId];
    }

    /**
     * 創建堆疊條形圖
     */
    createStackedBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        // 銷毀現有圖表
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '測量值與醫學標準值對比',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return `指標: ${context[0].label}`;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const unit = context.dataset.unit || '';
                            return `${label}: ${value}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '健康指標'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '數值'
                    },
                    stacked: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        };

        const config = {
            type: 'bar',
            data: this.prepareStackedBarData(data),
            options: { ...defaultOptions, ...options }
        };

        this.chartInstances[canvasId] = new Chart(ctx, config);
        return this.chartInstances[canvasId];
    }

    /**
     * 創建風險分層餅圖
     */
    createRiskStratificationPieChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        // 銷毀現有圖表
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '健康風險分層',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        const config = {
            type: 'doughnut',
            data: this.prepareRiskStratificationData(data),
            options: { ...defaultOptions, ...options }
        };

        this.chartInstances[canvasId] = new Chart(ctx, config);
        return this.chartInstances[canvasId];
    }

    /**
     * 準備雙軸數據
     */
    prepareDualAxisData(data) {
        const labels = data.map(item => item.timestamp);
        const systolicData = data.map(item => item.bloodPressure?.systolic || null);
        const diastolicData = data.map(item => item.bloodPressure?.diastolic || null);
        const pulseData = data.map(item => item.bloodPressure?.pulse || item.spO2?.pr || null);

        return {
            labels: labels,
            datasets: [
                {
                    label: '收縮壓',
                    data: systolicData,
                    borderColor: this.colorPalettes.medical.primary,
                    backgroundColor: this.colorPalettes.medical.primary + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y',
                    unit: 'mmHg'
                },
                {
                    label: '舒張壓',
                    data: diastolicData,
                    borderColor: this.colorPalettes.medical.info,
                    backgroundColor: this.colorPalettes.medical.info + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y',
                    unit: 'mmHg'
                },
                {
                    label: '脈搏',
                    data: pulseData,
                    borderColor: this.colorPalettes.medical.secondary,
                    backgroundColor: this.colorPalettes.medical.secondary + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1',
                    unit: 'bpm'
                }
            ]
        };
    }

    /**
     * 準備血氧數據
     */
    prepareBloodOxygenData(data) {
        const labels = data.map(item => item.timestamp);
        const spo2Data = data.map(item => item.spO2?.percent || null);
        const piData = data.map(item => item.spO2?.pi || null);

        return {
            labels: labels,
            datasets: [
                {
                    label: '血氧飽和度',
                    data: spo2Data,
                    borderColor: this.colorPalettes.medical.success,
                    backgroundColor: this.colorPalettes.medical.success + '30',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '灌注指數',
                    data: piData,
                    borderColor: this.colorPalettes.medical.warning,
                    backgroundColor: this.colorPalettes.medical.warning + '20',
                    borderWidth: 1,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        };
    }

    /**
     * 準備體溫數據
     */
    prepareTemperatureData(data) {
        const labels = data.map(item => item.timestamp);
        const temperatureData = data.map(item => item.temperature?.value || null);

        return {
            labels: labels,
            datasets: [
                {
                    label: '體溫',
                    data: temperatureData,
                    backgroundColor: this.colorPalettes.medical.warning + '80',
                    borderColor: this.colorPalettes.medical.warning,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }
            ]
        };
    }

    /**
     * 準備相關性數據
     */
    prepareCorrelationData(data) {
        // 計算相關性矩陣
        const correlationMatrix = this.calculateCorrelationMatrix(data);
        
        // 轉換為散點圖數據
        const scatterData = [];
        const labels = ['收縮壓', '舒張壓', '脈搏', '血氧', '體溫'];
        
        for (let i = 0; i < correlationMatrix.length; i++) {
            for (let j = 0; j < correlationMatrix[i].length; j++) {
                scatterData.push({
                    x: j,
                    y: i,
                    r: Math.abs(correlationMatrix[i][j]) * 20 + 5 // 半徑基於相關性強度
                });
            }
        }

        return {
            datasets: [{
                label: '相關性強度',
                data: scatterData,
                backgroundColor: this.colorPalettes.medical.purple + '60',
                borderColor: this.colorPalettes.medical.purple,
                borderWidth: 1
            }]
        };
    }

    /**
     * 準備堆疊條形圖數據
     */
    prepareStackedBarData(data) {
        const labels = ['收縮壓', '舒張壓', '脈搏', '血氧', '體溫'];
        const currentValues = this.extractCurrentValues(data);
        const standardValues = this.getStandardValues();

        return {
            labels: labels,
            datasets: [
                {
                    label: '當前測量值',
                    data: currentValues,
                    backgroundColor: this.colorPalettes.medical.primary + '80',
                    borderColor: this.colorPalettes.medical.primary,
                    borderWidth: 1
                },
                {
                    label: '醫學標準值',
                    data: standardValues,
                    backgroundColor: this.colorPalettes.medical.success + '60',
                    borderColor: this.colorPalettes.medical.success,
                    borderWidth: 1
                },
                {
                    label: '個人歷史峰值',
                    data: this.getHistoricalPeaks(data),
                    backgroundColor: this.colorPalettes.medical.warning + '60',
                    borderColor: this.colorPalettes.medical.warning,
                    borderWidth: 1
                }
            ]
        };
    }

    /**
     * 準備風險分層數據
     */
    prepareRiskStratificationData(data) {
        const riskCounts = this.calculateRiskCounts(data);
        
        return {
            labels: ['低風險', '中等風險', '高風險', '極高風險'],
            datasets: [{
                data: [
                    riskCounts.low,
                    riskCounts.moderate,
                    riskCounts.high,
                    riskCounts.veryHigh
                ],
                backgroundColor: [
                    this.colorPalettes.medical.success,
                    this.colorPalettes.medical.warning,
                    this.colorPalettes.medical.secondary,
                    this.colorPalettes.medical.primary
                ],
                borderColor: [
                    this.colorPalettes.medical.success,
                    this.colorPalettes.medical.warning,
                    this.colorPalettes.medical.secondary,
                    this.colorPalettes.medical.primary
                ],
                borderWidth: 2
            }]
        };
    }

    /**
     * 計算相關性矩陣
     */
    calculateCorrelationMatrix(data) {
        const indicators = this.extractIndicators(data);
        const matrix = [];
        
        for (let i = 0; i < indicators.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < indicators.length; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0; // 自相關
                } else {
                    matrix[i][j] = this.calculateCorrelation(indicators[i], indicators[j]);
                }
            }
        }
        
        return matrix;
    }

    /**
     * 提取指標數據
     */
    extractIndicators(data) {
        return [
            data.map(item => item.bloodPressure?.systolic || 0),      // 收縮壓
            data.map(item => item.bloodPressure?.diastolic || 0),     // 舒張壓
            data.map(item => item.bloodPressure?.pulse || item.spO2?.pr || 0), // 脈搏
            data.map(item => item.spO2?.percent || 0),                // 血氧
            data.map(item => item.temperature?.value || 0)            // 體溫
        ];
    }

    /**
     * 計算兩個變量的相關性
     */
    calculateCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return 0;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * 提取當前值
     */
    extractCurrentValues(data) {
        if (data.length === 0) return [0, 0, 0, 0, 0];
        
        const latest = data[data.length - 1];
        return [
            latest.bloodPressure?.systolic || 0,
            latest.bloodPressure?.diastolic || 0,
            latest.bloodPressure?.pulse || latest.spO2?.pr || 0,
            latest.spO2?.percent || 0,
            latest.temperature?.value || 0
        ];
    }

    /**
     * 獲取標準值
     */
    getStandardValues() {
        return [
            this.medicalStandards.bloodPressure.normal.systolic,
            this.medicalStandards.bloodPressure.normal.diastolic,
            (this.medicalStandards.pulse.normal.min + this.medicalStandards.pulse.normal.max) / 2,
            this.medicalStandards.bloodOxygen.normal,
            (this.medicalStandards.temperature.axillary.min + this.medicalStandards.temperature.axillary.max) / 2
        ];
    }

    /**
     * 獲取歷史峰值
     */
    getHistoricalPeaks(data) {
        if (data.length === 0) return [0, 0, 0, 0, 0];
        
        const systolicValues = data.map(item => item.bloodPressure?.systolic || 0);
        const diastolicValues = data.map(item => item.bloodPressure?.diastolic || 0);
        const pulseValues = data.map(item => item.bloodPressure?.pulse || item.spO2?.pr || 0);
        const spo2Values = data.map(item => item.spO2?.percent || 0);
        const tempValues = data.map(item => item.temperature?.value || 0);
        
        return [
            Math.max(...systolicValues),
            Math.max(...diastolicValues),
            Math.max(...pulseValues),
            Math.max(...spo2Values),
            Math.max(...tempValues)
        ];
    }

    /**
     * 計算風險計數
     */
    calculateRiskCounts(data) {
        let low = 0, moderate = 0, high = 0, veryHigh = 0;
        
        data.forEach(item => {
            const riskLevel = this.assessRiskLevel(item);
            switch (riskLevel) {
                case 'low': low++; break;
                case 'moderate': moderate++; break;
                case 'high': high++; break;
                case 'very_high': veryHigh++; break;
            }
        });
        
        return { low, moderate, high, veryHigh };
    }

    /**
     * 評估風險等級
     */
    assessRiskLevel(item) {
        let riskScore = 0;
        
        // 血壓風險
        if (item.bloodPressure) {
            const { systolic, diastolic } = item.bloodPressure;
            if (systolic >= 180 || diastolic >= 110) riskScore += 3;
            else if (systolic >= 160 || diastolic >= 100) riskScore += 2;
            else if (systolic >= 140 || diastolic >= 90) riskScore += 1;
        }
        
        // 血氧風險
        if (item.spO2) {
            if (item.spO2.percent < 85) riskScore += 3;
            else if (item.spO2.percent < 90) riskScore += 2;
            else if (item.spO2.percent < 95) riskScore += 1;
        }
        
        // 體溫風險
        if (item.temperature) {
            if (item.temperature.value > 38.5 || item.temperature.value < 35) riskScore += 2;
            else if (item.temperature.value > 37.5 || item.temperature.value < 36) riskScore += 1;
        }
        
        // 脈搏風險
        const pulse = item.bloodPressure?.pulse || item.spO2?.pr;
        if (pulse) {
            if (pulse > 120 || pulse < 50) riskScore += 2;
            else if (pulse > 100 || pulse < 60) riskScore += 1;
        }
        
        if (riskScore >= 6) return 'very_high';
        if (riskScore >= 4) return 'high';
        if (riskScore >= 2) return 'moderate';
        return 'low';
    }

    /**
     * 銷毀所有圖表實例
     */
    destroyAllCharts() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.chartInstances = {};
    }

    /**
     * 銷毀指定圖表
     */
    destroyChart(canvasId) {
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
            delete this.chartInstances[canvasId];
        }
    }

    /**
     * 更新圖表數據
     */
    updateChartData(canvasId, newData) {
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].data = newData;
            this.chartInstances[canvasId].update();
        }
    }

    /**
     * 獲取圖表實例
     */
    getChart(canvasId) {
        return this.chartInstances[canvasId];
    }
}

// 導出類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfessionalVisualization;
}