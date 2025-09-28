// Chart.js instances need to be tracked to be destroyed
let chartInstances = {};
let reportDays = 7;
let crosshairSync = { active: false, x: null };
let playbackState = { isPlaying: false, currentIndex: 0, interval: null, speed: 1 };
let chartConfig = {
    legend: { show: true, clickable: true },
    tension: 0.4,
    theme: 'default',
    units: { bp: 'mmHg', bs: 'mmol/L' },
    grid: { show: true, opacity: 0.2 },
    animation: { enable: true, duration: 250 }
};

/**
 * 設置報告區圖表期間（天）並重繪
 * @param {number} days 7|30|90
 */
const setReportDays = (days) => {
    reportDays = Number(days) || 7;
    try { renderAllReportCharts(); } catch (e) {}
};

/**
 * 讀取 CSS 變量，若不存在則退回預設色
 * @param {string} varName CSS 變量名稱（如 --color-blue）
 * @param {string} fallback 後備顏色
 * @returns {string}
 */
const themeVar = (varName, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
};

/**
 * 取得本地近 N 天健康資料（若資料不足，回退示例資料）
 * @param {number} days 需要的天數
 * @returns {{labels:string[], heartRate:number[], systolic:number[], diastolic:number[], bloodSugar:number[]}}
 */
const getRecentHealthSeries = (days = reportDays) => {
    try {
        const store = (window.appData && Array.isArray(window.appData.healthData)) ? window.appData.healthData : [];
        const sorted = [...store].sort((a, b) => new Date(a.lastUpdated || a.date || 0) - new Date(b.lastUpdated || b.date || 0));
        const recent = sorted.slice(-days);
        if (recent.length > 0) {
            const labels = recent.map(d => {
                const t = new Date(d.lastUpdated || d.date || Date.now());
                return `${t.getMonth() + 1}/${String(t.getDate()).padStart(2, '0')}`;
            });
            const heartRate = recent.map(d => Number(d.heartRate) || null);
            const systolic = recent.map(d => Number(d.bloodPressure?.systolic || d.systolic) || null);
            const diastolic = recent.map(d => Number(d.bloodPressure?.diastolic || d.diastolic) || null);
            const bloodSugar = recent.map(d => Number(d.bloodSugar) || null);
            const sleepDuration = recent.map(d => Number(d.sleepDuration) || null);
            const hrv = recent.map(d => Number(d.hrv) || null);
            const healthScore = recent.map(d => Number(d.healthScore) || null);
            return { labels, heartRate, systolic, diastolic, bloodSugar, sleepDuration, hrv, healthScore };
        }
    } catch (e) { console.warn('getRecentHealthSeries error:', e); }
    
    // 回退示例資料
    const labels = Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`;
    });
    return {
        labels,
        heartRate: Array.from({ length: days }, () => Math.floor(Math.random() * 20) + 70),
        systolic: Array.from({ length: days }, () => Math.floor(Math.random() * 20) + 110),
        diastolic: Array.from({ length: days }, () => Math.floor(Math.random() * 15) + 70),
        bloodSugar: Array.from({ length: days }, () => (Math.random() * 2 + 4).toFixed(1)),
        sleepDuration: Array.from({ length: days }, () => (Math.random() * 2 + 7).toFixed(1)),
        hrv: Array.from({ length: days }, () => Math.floor(Math.random() * 20) + 25),
        healthScore: Array.from({ length: days }, () => Math.floor(Math.random() * 20) + 75)
    };
};

/**
 * 掛載資料集切換按鈕到圖表容器
 * @param {string} chartId 圖表ID
 * @param {Chart} chart Chart.js實例
 */
const mountDatasetToggles = (chartId, chart) => {
    const container = document.getElementById(chartId)?.parentElement;
    if (!container || !chart?.data?.datasets) return;
    
    const togglesContainer = container.querySelector('.dataset-toggles') || (() => {
        const div = document.createElement('div');
        div.className = 'dataset-toggles flex flex-wrap gap-2 mb-2';
        container.insertBefore(div, container.firstChild);
        return div;
    })();
    
    togglesContainer.innerHTML = '';
    chart.data.datasets.forEach((dataset, index) => {
        const label = document.createElement('label');
        label.className = 'flex items-center text-xs cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="mr-1" ${chart.isDatasetVisible(index) ? 'checked' : ''}>
            <span style="color: ${dataset.borderColor || dataset.backgroundColor}">${dataset.label}</span>
        `;
        label.querySelector('input').addEventListener('change', (e) => {
            const meta = chart.getDatasetMeta(index);
            meta.hidden = !e.target.checked;
            chart.update();
        });
        togglesContainer.appendChild(label);
    });
};

/**
 * 通用圖表渲染函數
 * @param {string} chartId 圖表容器ID
 * @param {string} type 圖表類型
 * @param {Object} data 圖表數據
 * @param {Object} options 圖表選項
 */
const renderChart = (chartId, type, data, options = {}) => {
    const ctx = document.getElementById(chartId);
    if (!ctx) return;

    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
    }

    const common = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        animation: { duration: 250, easing: 'easeOutCubic' },
        plugins: {
            legend: {
                labels: { color: themeVar('--text-neutral-600', '#6B7280') }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
            }
        },
        scales: { x: { grid: { color: 'rgba(148,163,184,0.2)' } }, y: { grid: { color: 'rgba(148,163,184,0.2)' } } }
    };

    chartInstances[chartId] = new Chart(ctx, { type, data, options: Object.assign({}, common, options) });
    // 掛載資料集切換
    try { mountDatasetToggles(chartId, chartInstances[chartId]); } catch (e) { console.warn('mountDatasetToggles error:', e); }
    try { bindAdvancedTooltip(chartId); } catch (e) { console.warn('bindAdvancedTooltip error:', e); }
    
    // 綁定十字準星聯動
    try {
        const chart = chartInstances[chartId];
        chart.canvas.addEventListener('mousemove', (e) => {
            const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
            if (points.length > 0) {
                const point = points[0];
                const dataIndex = point.index;
                crosshairSync.active = true;
                crosshairSync.x = dataIndex;
                syncCrosshairAcrossCharts(dataIndex);
            }
        });
        chart.canvas.addEventListener('mouseleave', () => {
            crosshairSync.active = false;
            crosshairSync.x = null;
            clearCrosshairAcrossCharts();
        });
    } catch {}
    
    // 綁定全屏預覽（右鍵或雙擊）
    try { 
        ctx.oncontextmenu = (e) => { e.preventDefault(); openFullscreenChart(chartId); };
        ctx.ondblclick = () => openFullscreenChart(chartId);
    } catch {}
};

/**
 * 渲染血壓趨勢圖
 */
const renderReportBloodPressureChart = () => {
    const { labels, systolic, diastolic } = getRecentHealthSeries();
    renderChart('report-blood-pressure-chart', 'line', {
        labels,
        datasets: [
            {
            label: '收缩压',
                data: systolic,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: false
            },
            {
                label: '舒张压',
                data: diastolic,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: false
            }
        ]
    }, {
        scales: {
            y: { 
                beginAtZero: false,
                min: 50,
                max: 200,
                title: { display: true, text: '血压 (mmHg)' }
            }
        }
    });
};

/**
 * 渲染血糖趨勢圖
 */
const renderReportBloodSugarChart = () => {
    const { labels, bloodSugar } = getRecentHealthSeries();
    renderChart('report-blood-sugar-chart', 'line', {
        labels,
        datasets: [{
            label: '血糖',
            data: bloodSugar,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
        }]
    }, {
        scales: {
            y: { 
                beginAtZero: false,
                min: 3,
                max: 10,
                title: { display: true, text: '血糖 (mmol/L)' }
            }
        }
    });
};

/**
 * 渲染心率趨勢圖
 */
const renderReportHeartRateChart = () => {
    const { labels, heartRate } = getRecentHealthSeries();
    renderChart('report-heart-rate-chart', 'line', {
        labels,
        datasets: [{
            label: '心率',
            data: heartRate,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            tension: 0.4,
            fill: true
        }]
    }, {
        scales: {
            y: { 
                beginAtZero: false,
                min: 50,
                max: 120,
                title: { display: true, text: '心率 (bpm)' }
            }
        }
    });
};

/**
 * 渲染睡眠質量圖
 */
const renderReportSleepQualityChart = () => {
    const { labels, sleepDuration } = getRecentHealthSeries();
    renderChart('report-sleep-quality-chart', 'bar', {
        labels,
        datasets: [{
            label: '睡眠时长',
            data: sleepDuration,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: '#6366f1',
            borderWidth: 1
        }]
    }, {
        scales: {
            y: { 
                beginAtZero: true,
                max: 12,
                title: { display: true, text: '睡眠时长 (小时)' }
            }
        }
    });
};

/**
 * 渲染每周睡眠圖
 */
const renderReportWeeklySleepChart = () => {
    const { labels, sleepDuration } = getRecentHealthSeries(7);
    renderChart('report-weekly-sleep-chart', 'doughnut', {
        labels,
        datasets: [{
            data: sleepDuration,
            backgroundColor: [
                '#ef4444', '#f97316', '#eab308', '#22c55e',
                '#06b6d4', '#3b82f6', '#8b5cf6'
            ]
        }]
    }, {
        plugins: {
            legend: { position: 'bottom' }
        }
    });
};

/**
 * 渲染HRV趨勢圖
 */
const renderReportHRVTrendChart = () => {
    const { labels, hrv } = getRecentHealthSeries();
    renderChart('report-hrv-trend-chart', 'line', {
        labels,
        datasets: [{
            label: 'HRV',
            data: hrv,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
        }]
    }, {
        scales: {
            y: { 
                beginAtZero: false,
                min: 15,
                max: 60,
                title: { display: true, text: 'HRV (ms)' }
            }
        }
    });
};

/**
 * 渲染健康總分圖
 */
const renderReportHealthScoreChart = () => {
    const { labels, healthScore } = getRecentHealthSeries();
    renderChart('report-health-score-chart', 'line', {
        labels,
        datasets: [{
            label: '健康总分',
            data: healthScore,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
        }]
    }, {
        scales: {
            y: { 
                beginAtZero: false,
                min: 60,
                max: 100,
                title: { display: true, text: '健康总分' }
            }
        }
    });
};

/**
 * 渲染所有報告區圖表
 */
const renderAllReportCharts = () => {
    try {
        renderReportBloodPressureChart();
        renderReportBloodSugarChart();
        renderReportHeartRateChart();
        renderReportSleepQualityChart();
        renderReportWeeklySleepChart();
        renderReportHRVTrendChart();
        renderReportHealthScoreChart();
    } catch (e) {
        console.warn('renderAllReportCharts error:', e);
    }
};

/**
 * 全屏圖表預覽
 */
const openFullscreenChart = (chartId) => {
    const chart = chartInstances[chartId];
    if (!chart) return;
    
    const modal = document.getElementById('chart-fullscreen-modal');
    const canvas = document.getElementById('chart-fullscreen-canvas');
    if (!modal || !canvas) return;
    
    // 創建全屏圖表
    const fullscreenChart = new Chart(canvas, {
        type: chart.config.type,
        data: JSON.parse(JSON.stringify(chart.data)),
        options: {
            ...chart.options,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                ...chart.options.plugins,
                legend: { display: true, position: 'top' }
            }
        }
    });
    
    chartInstances['__fullscreen'] = fullscreenChart;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // 關閉按鈕
    document.getElementById('chart-fullscreen-close').onclick = () => {
        fullscreenChart.destroy();
        delete chartInstances['__fullscreen'];
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };
};

/**
 * 同步十字準星到所有圖表
 */
const syncCrosshairAcrossCharts = (dataIndex) => {
    Object.keys(chartInstances).forEach(id => {
        if (id === '__fullscreen') return;
        const chart = chartInstances[id];
        if (!chart) return;
        
        // 更新十字準星位置
        chart.options.plugins.annotation = {
            annotations: {
                line1: {
                    type: 'line',
                    xMin: dataIndex,
                    xMax: dataIndex,
                    borderColor: 'rgba(99, 102, 241, 0.8)',
                    borderWidth: 2,
                    label: {
                        content: `Day ${dataIndex + 1}`,
                        enabled: true,
                        position: 'start'
                    }
                }
            }
        };
        chart.update('none');
    });
};

/**
 * 清除所有圖表的十字準星
 */
const clearCrosshairAcrossCharts = () => {
    Object.keys(chartInstances).forEach(id => {
        if (id === '__fullscreen') return;
        const chart = chartInstances[id];
        if (!chart) return;
        
        chart.options.plugins.annotation = { annotations: {} };
        chart.update('none');
    });
};

/**
 * 初始化時間軸回放控制
 */
const initTimelinePlayback = () => {
    const playBtn = document.getElementById('playback-play');
    const progressBar = document.getElementById('playback-progress');
    const timeDisplay = document.getElementById('playback-time');
    const speedSelect = document.getElementById('playback-speed');
    
    if (!playBtn || !progressBar || !timeDisplay || !speedSelect) return;
    
    const updatePlaybackUI = () => {
        const total = reportDays;
        const current = playbackState.currentIndex;
        const progress = (current / Math.max(total - 1, 1)) * 100;
        
        progressBar.style.width = `${progress}%`;
        timeDisplay.textContent = `${current}/${total}`;
        playBtn.innerHTML = playbackState.isPlaying ? '<i class="fa fa-pause text-xs"></i>' : '<i class="fa fa-play text-xs"></i>';
    };
    
    const startPlayback = () => {
        if (playbackState.isPlaying) return;
        playbackState.isPlaying = true;
        playbackState.interval = setInterval(() => {
            playbackState.currentIndex++;
            if (playbackState.currentIndex >= reportDays) {
                stopPlayback();
                return;
            }
            syncCrosshairAcrossCharts(playbackState.currentIndex);
            updatePlaybackUI();
        }, 1000 / playbackState.speed);
        updatePlaybackUI();
    };
    
    const stopPlayback = () => {
        playbackState.isPlaying = false;
        if (playbackState.interval) {
            clearInterval(playbackState.interval);
            playbackState.interval = null;
        }
        clearCrosshairAcrossCharts();
        updatePlaybackUI();
    };
    
    const resetPlayback = () => {
        stopPlayback();
        playbackState.currentIndex = 0;
        updatePlaybackUI();
    };
    
    // 事件綁定
    playBtn.addEventListener('click', () => {
        if (playbackState.isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });
    
    speedSelect.addEventListener('change', (e) => {
        playbackState.speed = parseInt(e.target.value);
        if (playbackState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });
    
    // 進度條點擊跳轉
    progressBar.parentElement.addEventListener('click', (e) => {
        const rect = progressBar.parentElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newIndex = Math.floor(percentage * (reportDays - 1));
        playbackState.currentIndex = Math.max(0, Math.min(newIndex, reportDays - 1));
        syncCrosshairAcrossCharts(playbackState.currentIndex);
        updatePlaybackUI();
    });
    
    // 期間切換時重置回放
    const periodSelect = document.getElementById('report-period-select');
    if (periodSelect) {
        periodSelect.addEventListener('change', resetPlayback);
    }
    
    updatePlaybackUI();
};

/**
 * 初始化配置抽屜
 */
const initConfigDrawer = () => {
    const drawer = document.getElementById('chart-config-drawer');
    const toggle = document.getElementById('config-drawer-toggle');
    const close = document.getElementById('config-drawer-close');
    
    if (!drawer || !toggle || !close) return;
    
    // 開關抽屜
    const openDrawer = () => drawer.classList.remove('translate-x-full');
    const closeDrawer = () => drawer.classList.add('translate-x-full');
    
    toggle.addEventListener('click', openDrawer);
    close.addEventListener('click', closeDrawer);
    
    // 配置項事件綁定
    const tensionSlider = document.getElementById('config-tension');
    const tensionValue = document.getElementById('tension-value');
    if (tensionSlider && tensionValue) {
        tensionSlider.addEventListener('input', (e) => {
            chartConfig.tension = parseFloat(e.target.value);
            tensionValue.textContent = e.target.value;
            applyConfigToCharts();
        });
    }
    
    const gridOpacitySlider = document.getElementById('config-grid-opacity');
    const gridOpacityValue = document.getElementById('grid-opacity-value');
    if (gridOpacitySlider && gridOpacityValue) {
        gridOpacitySlider.addEventListener('input', (e) => {
            chartConfig.grid.opacity = parseFloat(e.target.value);
            gridOpacityValue.textContent = `${Math.round(e.target.value * 100)}%`;
            applyConfigToCharts();
        });
    }
    
    const animationDurationSlider = document.getElementById('config-animation-duration');
    const animationDurationValue = document.getElementById('animation-duration-value');
    if (animationDurationSlider && animationDurationValue) {
        animationDurationSlider.addEventListener('input', (e) => {
            chartConfig.animation.duration = parseInt(e.target.value);
            animationDurationValue.textContent = `${e.target.value}ms`;
            applyConfigToCharts();
        });
    }
    
    // 色板主題
    document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            chartConfig.theme = e.target.dataset.theme;
            document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('bg-primary', 'text-white'));
            e.target.classList.add('bg-primary', 'text-white');
            applyConfigToCharts();
        });
    });
    
    // 重置按鈕
    const resetBtn = document.getElementById('config-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            chartConfig = {
                legend: { show: true, clickable: true },
                tension: 0.4,
                theme: 'default',
                units: { bp: 'mmHg', bs: 'mmol/L' },
                grid: { show: true, opacity: 0.2 },
                animation: { enable: true, duration: 250 }
            };
            updateConfigUI();
            applyConfigToCharts();
        });
    }
};

/**
 * 更新配置UI顯示
 */
const updateConfigUI = () => {
    document.getElementById('config-tension').value = chartConfig.tension;
    document.getElementById('tension-value').textContent = chartConfig.tension;
    document.getElementById('config-grid-opacity').value = chartConfig.grid.opacity;
    document.getElementById('grid-opacity-value').textContent = `${Math.round(chartConfig.grid.opacity * 100)}%`;
    document.getElementById('config-animation-duration').value = chartConfig.animation.duration;
    document.getElementById('animation-duration-value').textContent = `${chartConfig.animation.duration}ms`;
    
    document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        if (btn.dataset.theme === chartConfig.theme) {
            btn.classList.add('bg-primary', 'text-white');
        }
    });
};

/**
 * 應用配置到所有圖表
 */
const applyConfigToCharts = () => {
    Object.keys(chartInstances).forEach(chartId => {
        if (chartId === '__fullscreen') return;
        const chart = chartInstances[chartId];
        if (!chart) return;
        
        // 更新圖例
        chart.options.plugins.legend.display = chartConfig.legend.show;
        chart.options.plugins.legend.onClick = chartConfig.legend.clickable ? undefined : null;
        
        // 更新平滑度
        chart.data.datasets.forEach(dataset => {
            if (dataset.tension !== undefined) {
                dataset.tension = chartConfig.tension;
            }
        });
        
        // 更新網格
        chart.options.scales.x.grid.display = chartConfig.grid.show;
        chart.options.scales.y.grid.display = chartConfig.grid.show;
        const gridColor = `rgba(148,163,184,${chartConfig.grid.opacity})`;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        
        // 更新動畫
        chart.options.animation.duration = chartConfig.animation.enable ? chartConfig.animation.duration : 0;
        
        chart.update('none');
    });
};

/**
 * 创建高级 HTML Tooltip
 */
const createAdvancedTooltip = (chart, dataIndex, datasets) => {
    const data = chart.data;
    const labels = data.labels;
    const currentDate = labels[dataIndex];
    
    // 获取当前和前一天的数据
    const currentData = {};
    const previousData = {};
    
    datasets.forEach(dataset => {
        const value = dataset.data[dataIndex];
        const prevValue = dataIndex > 0 ? dataset.data[dataIndex - 1] : null;
        
        currentData[dataset.label] = value;
        if (prevValue !== null) {
            previousData[dataset.label] = prevValue;
        }
    });
    
    // 计算同比环比
    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return null;
        const change = ((current - previous) / previous * 100);
        return {
            value: change,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            color: change > 0 ? '#ef4444' : change < 0 ? '#22c55e' : '#6b7280'
        };
    };
    
    // 健康指标阈值
    const thresholds = {
        '心率': { min: 60, max: 100, unit: 'bpm' },
        '收缩压': { min: 90, max: 140, unit: 'mmHg' },
        '舒张压': { min: 60, max: 90, unit: 'mmHg' },
        '血糖': { min: 3.9, max: 6.1, unit: 'mmol/L' },
        '睡眠时长': { min: 7, max: 9, unit: '小时' },
        'HRV': { min: 20, max: 50, unit: 'ms' },
        '健康总分': { min: 70, max: 100, unit: '分' }
    };
    
    // 检查阈值状态
    const checkThreshold = (label, value) => {
        const threshold = thresholds[label];
        if (!threshold) return null;
        
        if (value < threshold.min) {
            return { status: 'low', color: '#3b82f6', message: '偏低' };
        } else if (value > threshold.max) {
            return { status: 'high', color: '#ef4444', message: '偏高' };
        } else {
            return { status: 'normal', color: '#22c55e', message: '正常' };
        }
    };
    
    // 构建 HTML 内容
    let html = `
        <div class="advanced-tooltip">
            <div class="tooltip-header">
                <h4>${currentDate}</h4>
                <span class="tooltip-subtitle">健康数据详情</span>
            </div>
            <div class="tooltip-content">
    `;
    
    datasets.forEach(dataset => {
        const value = currentData[dataset.label];
        const prevValue = previousData[dataset.label];
        const change = calculateChange(value, prevValue);
        const threshold = checkThreshold(dataset.label, value);
        
        html += `
            <div class="tooltip-item">
                <div class="tooltip-item-header">
                    <span class="tooltip-label" style="color: ${dataset.borderColor}">${dataset.label}</span>
                    <span class="tooltip-value">${value}${thresholds[dataset.label]?.unit || ''}</span>
                </div>
        `;
        
        if (change) {
            const changeIcon = change.direction === 'up' ? '↗' : change.direction === 'down' ? '↘' : '→';
            html += `
                <div class="tooltip-change" style="color: ${change.color}">
                    ${changeIcon} ${change.direction === 'up' ? '+' : ''}${change.value.toFixed(1)}%
                </div>
            `;
        }
        
        if (threshold) {
            html += `
                <div class="tooltip-threshold" style="color: ${threshold.color}">
                    ${threshold.message}
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    html += `
            </div>
            <div class="tooltip-footer">
                <small>点击图表查看全屏 • 右键配置选项</small>
            </div>
        </div>
    `;
    
    return html;
};

/**
 * 初始化高级 Tooltip
 */
const initAdvancedTooltip = () => {
    // 创建 tooltip 容器
    let tooltipContainer = document.getElementById('advanced-tooltip-container');
    if (!tooltipContainer) {
        tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'advanced-tooltip-container';
        tooltipContainer.className = 'fixed pointer-events-none z-50 hidden';
        document.body.appendChild(tooltipContainer);
    }
    
    // 添加样式
    if (!document.getElementById('advanced-tooltip-styles')) {
        const style = document.createElement('style');
        style.id = 'advanced-tooltip-styles';
        style.textContent = `
            .advanced-tooltip {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                padding: 16px;
                max-width: 320px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .tooltip-header {
                border-bottom: 1px solid #f3f4f6;
                padding-bottom: 8px;
                margin-bottom: 12px;
            }
            .tooltip-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #111827;
            }
            .tooltip-subtitle {
                font-size: 12px;
                color: #6b7280;
            }
            .tooltip-item {
                margin-bottom: 12px;
                padding: 8px;
                background: #f9fafb;
                border-radius: 8px;
            }
            .tooltip-item:last-child {
                margin-bottom: 0;
            }
            .tooltip-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }
            .tooltip-label {
                font-size: 13px;
                font-weight: 500;
            }
            .tooltip-value {
                font-size: 13px;
                font-weight: 600;
                color: #111827;
            }
            .tooltip-change {
                font-size: 11px;
                font-weight: 500;
                margin-bottom: 2px;
            }
            .tooltip-threshold {
                font-size: 11px;
                font-weight: 500;
            }
            .tooltip-footer {
                border-top: 1px solid #f3f4f6;
                padding-top: 8px;
                margin-top: 12px;
                text-align: center;
            }
            .tooltip-footer small {
                color: #9ca3af;
                font-size: 10px;
            }
        `;
        document.head.appendChild(style);
    }
};

/**
 * 显示高级 Tooltip
 */
const showAdvancedTooltip = (event, chart, dataIndex) => {
    const tooltipContainer = document.getElementById('advanced-tooltip-container');
    if (!tooltipContainer) return;
    
    const datasets = chart.data.datasets.filter(ds => ds.data[dataIndex] !== undefined);
    if (datasets.length === 0) return;
    
    const html = createAdvancedTooltip(chart, dataIndex, datasets);
    tooltipContainer.innerHTML = html;
    
    // 定位 tooltip
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    tooltipContainer.style.left = `${Math.min(x + 10, window.innerWidth - 340)}px`;
    tooltipContainer.style.top = `${Math.max(y - 10, 10)}px`;
    tooltipContainer.classList.remove('hidden');
};

/**
 * 隐藏高级 Tooltip
 */
const hideAdvancedTooltip = () => {
    const tooltipContainer = document.getElementById('advanced-tooltip-container');
    if (tooltipContainer) {
        tooltipContainer.classList.add('hidden');
    }
};

/**
 * 为图表绑定高级 Tooltip
 */
const bindAdvancedTooltip = (chartId) => {
    const chart = chartInstances[chartId];
    if (!chart) return;
    
    const canvas = chart.canvas;
    
    canvas.addEventListener('mousemove', (event) => {
        const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true);
        if (points.length > 0) {
            const point = points[0];
            showAdvancedTooltip(event, chart, point.index);
        } else {
            hideAdvancedTooltip();
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        hideAdvancedTooltip();
    });
};

// 导出全局函数
window.setReportDays = setReportDays;
window.renderAllReportCharts = renderAllReportCharts;
window.openFullscreenChart = openFullscreenChart;
window.initTimelinePlayback = initTimelinePlayback;
window.initConfigDrawer = initConfigDrawer;
window.initAdvancedTooltip = initAdvancedTooltip;
window.bindAdvancedTooltip = bindAdvancedTooltip;