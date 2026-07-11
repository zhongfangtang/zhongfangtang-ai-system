/**
 * 中芳堂美业全域AI智能体系统 - BI数据中台
 * Dashboard 交互逻辑 & Chart.js 图表初始化
 */

// ==================== 全局状态 ====================
const state = {
    currentPeriod: 'day',
    charts: {},
    data: {}
};

// ==================== 工具函数 ====================
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
}

function formatCurrency(num) {
    if (num >= 10000) {
        return '¥' + (num / 10000).toFixed(2) + '万';
    }
    return '¥' + num.toLocaleString();
}

function formatPercent(num) {
    return num.toFixed(1) + '%';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 2500);
}

// ==================== 图表颜色配置 ====================
const chartColors = {
    gold: '#d4a853',
    goldLight: '#e8c97a',
    goldDark: '#b8862d',
    green: '#4caf84',
    red: '#e0556a',
    blue: '#5b9bd5',
    purple: '#9b7fd4',
    cyan: '#4dc9c0',
    gridLine: 'rgba(255,255,255,0.06)',
    tickColor: '#6a6a80'
};

// Chart.js 全局默认配置
Chart.defaults.color = chartColors.tickColor;
Chart.defaults.borderColor = chartColors.gridLine;
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.tooltip.backgroundColor = '#1a1a2e';
Chart.defaults.plugins.tooltip.borderColor = '#2a2a3e';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleColor = '#e8e8f0';
Chart.defaults.plugins.tooltip.bodyColor = '#a0a0b8';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;

// ==================== KPI卡片渲染 ====================
function renderKPICards(data) {
    const cards = [
        {
            id: 'kpi-exposure',
            value: formatNumber(data.totalExposure),
            label: '总曝光量',
            change: data.exposureGrowth,
            isGold: false
        },
        {
            id: 'kpi-acquisition',
            value: formatNumber(data.totalAcquisition),
            label: '总获客数',
            change: data.acquisitionGrowth,
            isGold: false
        },
        {
            id: 'kpi-conversion',
            value: formatNumber(data.totalConversion),
            label: '总转化数',
            change: data.conversionGrowth,
            isGold: false
        },
        {
            id: 'kpi-revenue',
            value: formatCurrency(data.totalRevenue),
            label: '总成交额',
            change: data.revenueGrowth,
            isGold: true
        },
        {
            id: 'kpi-roi',
            value: data.roi.toFixed(2),
            label: 'ROI',
            change: data.roiGrowth,
            isGold: true
        }
    ];

    cards.forEach(card => {
        const el = document.getElementById(card.id);
        if (!el) return;

        const changeClass = card.change >= 0 ? 'up' : 'down';
        const changeIcon = card.change >= 0 ? '▲' : '▼';
        const valueClass = card.isGold ? 'kpi-value gold' : 'kpi-value';

        el.innerHTML = `
            <div class="kpi-label">${card.label}</div>
            <div class="${valueClass}">${card.value}</div>
            <div class="kpi-change ${changeClass}">
                <span class="kpi-change-icon">${changeIcon}</span>
                ${Math.abs(card.change)}%
                <span style="color:#6a6a80;margin-left:4px;">vs 上期</span>
            </div>
        `;
    });
}

// ==================== 平台数据表格渲染 ====================
function renderPlatformTable(data) {
    const tbody = document.getElementById('platform-table-body');
    if (!tbody) return;

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>
                <span class="platform-name">
                    <span class="platform-icon">${row.icon}</span>
                    ${row.platform}
                </span>
            </td>
            <td>${formatNumber(row.followers)}</td>
            <td>${row.contentCount}</td>
            <td class="highlight">${formatNumber(row.exposure)}</td>
            <td>${formatNumber(row.plays)}</td>
            <td>${formatNumber(row.likes)}</td>
            <td>${formatNumber(row.comments)}</td>
            <td>${formatNumber(row.shares)}</td>
            <td>${formatNumber(row.referrals)}</td>
            <td>${formatNumber(row.acquisition)}</td>
            <td>${row.intentRate}%</td>
            <td>${formatNumber(row.conversion)}</td>
            <td>${formatCurrency(row.revenue)}</td>
        </tr>
    `).join('');
}

// ==================== 转化漏斗图 ====================
function renderFunnelChart(data) {
    const canvas = document.getElementById('funnel-chart');
    if (!canvas) return;

    if (state.charts.funnel) {
        state.charts.funnel.destroy();
    }

    const ctx = canvas.getContext('2d');

    // 更新漏斗文字
    const container = document.getElementById('funnel-stages-container');
    if (container) {
        const maxValue = data.values[0];
        container.innerHTML = data.stages.map((stage, i) => {
            const widthPercent = ((data.values[i] / maxValue) * 100).toFixed(0);
            return `
                <div class="funnel-stage">
                    <span class="funnel-stage-label">${stage}</span>
                    <div class="funnel-stage-bar-wrapper">
                        <div class="funnel-stage-bar" style="width: ${Math.max(widthPercent, 5)}%">
                            <span class="funnel-stage-value">${formatNumber(data.values[i])}</span>
                        </div>
                    </div>
                    <span class="funnel-stage-rate">${data.rates[i]}%</span>
                </div>
            `;
        }).join('');
    }

    // 右侧柱状图展示各阶段转化率
    state.charts.funnel = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.stages.slice(1),
            datasets: [{
                label: '阶段转化率',
                data: data.rates.slice(1),
                backgroundColor: [
                    'rgba(212,168,83,0.7)',
                    'rgba(184,134,45,0.7)',
                    'rgba(160,112,40,0.7)',
                    'rgba(140,90,30,0.7)'
                ],
                borderColor: [
                    '#d4a853',
                    '#b8862d',
                    '#a07028',
                    '#8c5a1e'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `转化率: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: chartColors.gridLine },
                    ticks: {
                        color: chartColors.tickColor,
                        callback: (v) => v + '%'
                    },
                    max: 100
                },
                y: {
                    grid: { display: false },
                    ticks: { color: chartColors.tickColor }
                }
            }
        }
    });
}

// ==================== 内容发布趋势折线图 ====================
function renderTrendChart(data) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    if (state.charts.trend) {
        state.charts.trend.destroy();
    }

    const ctx = canvas.getContext('2d');

    const gradient1 = ctx.createLinearGradient(0, 0, 0, 320);
    gradient1.addColorStop(0, 'rgba(212,168,83,0.3)');
    gradient1.addColorStop(1, 'rgba(212,168,83,0.0)');

    const gradient2 = ctx.createLinearGradient(0, 0, 0, 320);
    gradient2.addColorStop(0, 'rgba(91,155,213,0.3)');
    gradient2.addColorStop(1, 'rgba(91,155,213,0.0)');

    state.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: '曝光量',
                    data: data.datasets.exposure,
                    borderColor: chartColors.gold,
                    backgroundColor: gradient1,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: chartColors.gold,
                    yAxisID: 'y'
                },
                {
                    label: '互动量',
                    data: data.datasets.interaction,
                    borderColor: chartColors.blue,
                    backgroundColor: gradient2,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: chartColors.blue,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyleWidth: 8,
                        padding: 20,
                        color: chartColors.tickColor
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: chartColors.gridLine },
                    ticks: {
                        color: chartColors.tickColor,
                        maxTicksLimit: 10,
                        callback: function(val, index) {
                            return index % 5 === 0 ? this.getLabelForValue(val) : '';
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: chartColors.gridLine },
                    ticks: {
                        color: chartColors.tickColor,
                        callback: (v) => formatNumber(v)
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: chartColors.tickColor,
                        callback: (v) => formatNumber(v)
                    }
                }
            }
        }
    });
}

// ==================== 获客渠道饼图 ====================
function renderChannelChart(data) {
    const canvas = document.getElementById('channel-chart');
    if (!canvas) return;

    if (state.charts.channel) {
        state.charts.channel.destroy();
    }

    const ctx = canvas.getContext('2d');

    state.charts.channel = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: data.map(d => d.color),
                borderColor: '#13131c',
                borderWidth: 2,
                hoverBorderColor: '#d4a853',
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                        color: chartColors.tickColor,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            return ` ${ctx.label}: ${ctx.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// ==================== 用户画像雷达图 ====================
function renderRadarChart(data) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    if (state.charts.radar) {
        state.charts.radar.destroy();
    }

    const ctx = canvas.getContext('2d');

    state.charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: data.radar.labels,
            datasets: [{
                label: '用户画像',
                data: data.radar.values,
                backgroundColor: 'rgba(212,168,83,0.15)',
                borderColor: chartColors.gold,
                borderWidth: 2,
                pointBackgroundColor: chartColors.gold,
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: chartColors.gridLine },
                    angleLines: { color: chartColors.gridLine },
                    pointLabels: {
                        color: chartColors.tickColor,
                        font: { size: 11 }
                    },
                    ticks: {
                        display: false,
                        stepSize: 20
                    }
                }
            }
        }
    });

    // 年龄分布柱状图
    const ageCanvas = document.getElementById('age-chart');
    if (ageCanvas && !state.charts.age) {
        const ageCtx = ageCanvas.getContext('2d');
        state.charts.age = new Chart(ageCtx, {
            type: 'bar',
            data: {
                labels: data.age.map(d => d.label),
                datasets: [{
                    data: data.age.map(d => d.value),
                    backgroundColor: 'rgba(212,168,83,0.6)',
                    borderColor: '#d4a853',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `占比: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor, font: { size: 10 } }
                    },
                    y: {
                        grid: { color: chartColors.gridLine },
                        ticks: {
                            color: chartColors.tickColor,
                            callback: (v) => v + '%'
                        }
                    }
                }
            }
        });
    }

    // 需求分布
    const demandCanvas = document.getElementById('demand-chart');
    if (demandCanvas && !state.charts.demand) {
        const demandCtx = demandCanvas.getContext('2d');
        state.charts.demand = new Chart(demandCtx, {
            type: 'bar',
            data: {
                labels: data.demand.map(d => d.label),
                datasets: [{
                    data: data.demand.map(d => d.value),
                    backgroundColor: 'rgba(91,155,213,0.6)',
                    borderColor: '#5b9bd5',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `占比: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor, font: { size: 10 } }
                    },
                    y: {
                        grid: { color: chartColors.gridLine },
                        ticks: {
                            color: chartColors.tickColor,
                            callback: (v) => v + '%'
                        }
                    }
                }
            }
        });
    }
}

// ==================== 私域流量池面板 ====================
function renderPrivateDomain(data) {
    // 顶部统计
    const statsEl = document.getElementById('private-domain-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="private-stat">
                <div class="private-stat-value">${formatNumber(data.totalMembers)}</div>
                <div class="private-stat-label">私域总人数</div>
            </div>
            <div class="private-stat">
                <div class="private-stat-value">+${data.newMembers}</div>
                <div class="private-stat-label">本周新增</div>
            </div>
            <div class="private-stat">
                <div class="private-stat-value">${data.retentionRate}%</div>
                <div class="private-stat-label">留存率</div>
            </div>
        `;
    }

    // 群组列表
    const groupList = document.getElementById('group-list');
    if (groupList) {
        groupList.innerHTML = data.groups.map(group => `
            <div class="group-item">
                <div class="group-info">
                    <div class="group-name">${group.name}</div>
                    <div class="group-meta">${formatNumber(group.count)}人 · 活跃${formatNumber(group.active)}人</div>
                </div>
                <div class="group-conversion">${group.conversion}% 转化</div>
            </div>
        `).join('');
    }

    // 私域新增趋势
    const chartCanvas = document.getElementById('private-domain-chart');
    if (chartCanvas) {
        if (state.charts.privateDomain) {
            state.charts.privateDomain.destroy();
        }
        const ctx = chartCanvas.getContext('2d');
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

        state.charts.privateDomain = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: '每日新增',
                    data: data.dailyNewMembers,
                    backgroundColor: 'rgba(212,168,83,0.6)',
                    borderColor: '#d4a853',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 2
                }, {
                    label: '日活跃',
                    data: data.dailyActive,
                    type: 'line',
                    borderColor: chartColors.blue,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: chartColors.blue,
                    yAxisID: 'y1',
                    order: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            pointStyleWidth: 8,
                            padding: 16,
                            color: chartColors.tickColor
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: chartColors.gridLine },
                        ticks: {
                            color: chartColors.tickColor,
                            callback: (v) => formatNumber(v)
                        },
                        title: {
                            display: true,
                            text: '新增人数',
                            color: chartColors.tickColor
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: chartColors.tickColor,
                            callback: (v) => formatNumber(v)
                        },
                        title: {
                            display: true,
                            text: '活跃人数',
                            color: chartColors.tickColor
                        }
                    }
                }
            }
        });
    }
}

// ==================== 数据复盘报告 ====================
function renderReport(data) {
    const reportTitle = document.getElementById('report-title');
    const reportSummary = document.getElementById('report-summary');
    const reportHighlights = document.getElementById('report-highlights');
    const reportWarnings = document.getElementById('report-warnings');

    if (reportTitle) reportTitle.textContent = data.title;
    if (reportSummary) reportSummary.textContent = data.summary;

    if (reportHighlights) {
        reportHighlights.innerHTML = data.highlights.map(h => `<li>${h}</li>`).join('');
    }

    if (reportWarnings) {
        reportWarnings.innerHTML = data.warnings.map(w => `<li>${w}</li>`).join('');
    }
}

// ==================== 数据加载 ====================
async function loadAllData() {
    const loadingElements = document.querySelectorAll('.card');
    loadingElements.forEach(el => {
        el.style.position = 'relative';
    });

    try {
        // 并行加载所有数据
        const [
            overviewRes,
            platformRes,
            funnelRes,
            trendRes,
            channelRes,
            profileRes,
            privateRes,
            reportRes,
            geoRes
        ] = await Promise.all([
            API.getOverview(),
            API.getPlatformData(),
            API.getFunnel(),
            API.getTrend(),
            API.getChannel(),
            API.getUserProfile(),
            API.getPrivateDomain(),
            API.getReport(state.currentPeriod),
            API.getGEOData()
        ]);

        // 渲染所有组件
        renderKPICards(overviewRes.data);
        renderPlatformTable(platformRes.data);
        renderFunnelChart(funnelRes.data);
        renderTrendChart(trendRes.data);
        renderChannelChart(channelRes.data);
        renderRadarChart(profileRes.data);
        renderPrivateDomain(privateRes.data);
        renderReport(reportRes.data);
        renderGEO(geoRes.data);

    } catch (error) {
        console.error('数据加载失败:', error);
        showToast('数据加载失败，请刷新重试', 'error');
    }
}

// ==================== GEO 搜索占位渲染 ====================
function renderGEO(data) {
    if (!data) return;
    
    // 统计卡片
    const geoStats = document.getElementById('geo-stats');
    if (geoStats) {
        geoStats.innerHTML = `
            <div class="geo-stat"><div class="geo-stat-value gold">${formatNumber(data.totalImpressions || 0)}</div><div class="geo-stat-label">搜索展现量</div></div>
            <div class="geo-stat"><div class="geo-stat-value">${data.avgRank || '--'}</div><div class="geo-stat-label">平均排名</div></div>
            <div class="geo-stat"><div class="geo-stat-value">${formatPercent(data.ctr || 0)}</div><div class="geo-stat-label">搜索点击率</div></div>
            <div class="geo-stat"><div class="geo-stat-value">${data.geoScore || 0}分</div><div class="geo-stat-label">GEO友好度</div></div>
            <div class="geo-stat"><div class="geo-stat-value">${data.optimizedContents || 0}</div><div class="geo-stat-label">已优化内容</div></div>
        `;
    }

    // 关键词排名趋势图
    const rankingCtx = document.getElementById('geo-ranking-chart');
    if (rankingCtx && data.rankingTrend) {
        new Chart(rankingCtx, {
            type: 'line',
            data: {
                labels: data.rankingTrend.labels || [],
                datasets: data.rankingTrend.datasets || []
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#8a8aa0', font: { size: 10 } } } },
                scales: {
                    x: { ticks: { color: '#6a6a80', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { reverse: true, ticks: { color: '#6a6a80', font: { size: 9 }, callback: v => 'TOP' + v }, grid: { color: 'rgba(255,255,255,0.04)' } }
                }
            }
        });
    }

    // 平台搜索占比图
    const platformCtx = document.getElementById('geo-platform-chart');
    if (platformCtx && data.platformDistribution) {
        new Chart(platformCtx, {
            type: 'doughnut',
            data: {
                labels: data.platformDistribution.labels || [],
                datasets: [{
                    data: data.platformDistribution.values || [],
                    backgroundColor: ['#d4a853','#C97B6B','#5B8C5A','#5B7FBD','#8B3A5C'],
                    borderColor: '#13131c', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#8a8aa0', font: { size: 10 }, padding: 8 } } }
            }
        });
    }

    // 核心关键词列表
    const kwList = document.getElementById('geo-keywords-list');
    if (kwList && data.keywords) {
        let html = '<h4 style="color:#d4a853;margin-bottom:8px;font-size:13px;">🏷 核心关键词表现</h4>';
        data.keywords.forEach((kw, i) => {
            const rankClass = i < 3 ? 'top3' : i < 10 ? 'top10' : 'other';
            const changeClass = kw.change > 0 ? 'up' : kw.change < 0 ? 'down' : 'stable';
            const changeIcon = kw.change > 0 ? '▲' : kw.change < 0 ? '▼' : '─';
            html += `<div class="geo-keyword-row">
                <span class="geo-keyword-rank ${rankClass}">${kw.rank || i+1}</span>
                <span class="geo-keyword-name">${kw.keyword}</span>
                <span class="geo-keyword-change ${changeClass}">${changeIcon}${Math.abs(kw.change||0)}</span>
            </div>`;
        });
        kwList.innerHTML = html;
    }
}

// ==================== 时间切换 ====================
function switchPeriod(period) {
    state.currentPeriod = period;

    // 更新按钮状态
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });

    // 重新加载报告数据
    API.getReport(period).then(res => {
        if (res.code === 200) {
            renderReport(res.data);
        }
    });

    showToast(`已切换至${period === 'day' ? '日' : period === 'week' ? '周' : '月'}视图`, 'success');
}

// ==================== 页面初始化 ====================
function initDashboard() {
    // 绑定时间选择器
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPeriod(this.dataset.period);
        });
    });

    // 初始加载数据
    loadAllData();

    // 自动刷新（每60秒）
    setInterval(() => {
        loadAllData();
    }, 60000);

    console.log('%c中芳堂美业全域AI智能体系统 %cBI数据中台已就绪',
        'color: #d4a853; font-size: 16px; font-weight: bold;',
        'color: #a0a0b8;');
    console.log('%c数据模式: Mock数据 | 自动刷新: 60s',
        'color: #6a6a80; font-size: 11px;');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initDashboard);
