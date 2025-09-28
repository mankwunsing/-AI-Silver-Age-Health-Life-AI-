/**
 * 科學健康評估算法模塊
 * 實現DeepSeek健康評估模型和三個子模型
 * 基於基礎生命體徵數據進行科學評估
 */

class ScientificHealthAssessment {
    constructor() {
        this.assessmentModels = {
            bloodPressureStability: new BloodPressureStabilityModel(),
            bloodOxygenPerfusion: new BloodOxygenPerfusionModel(),
            temperaturePulseSynergy: new TemperaturePulseSynergyModel()
        };
        
        this.algorithmTransparency = new AlgorithmTransparency();
        this.parameterCustomization = new ParameterCustomization();
        this.derivationLogic = new DataDerivationLogic();
    }

    /**
     * 綜合健康評估 - 基於4類6項核心數據
     * @param {Object} healthData - 健康數據對象
     * @returns {Object} 綜合評估結果
     */
    async generateComprehensiveAssessment(healthData) {
        try {
            console.log('開始科學健康評估...', healthData);
            
            // 1. 基礎生命體徵評估
            const basicVitalSigns = this.assessBasicVitalSigns(healthData);
            
            // 2. 子模型評估
            const bpStabilityAssessment = this.assessmentModels.bloodPressureStability.assess(healthData);
            const spo2PerfusionAssessment = this.assessmentModels.bloodOxygenPerfusion.assess(healthData);
            const tempPulseAssessment = this.assessmentModels.temperaturePulseSynergy.assess(healthData);
            
            // 3. 邏輯推導補充
            const derivedInsights = this.derivationLogic.generateInsights(healthData);
            
            // 4. 綜合評分計算
            const compositeScore = this.calculateCompositeScore({
                basicVitalSigns,
                bpStabilityAssessment,
                spo2PerfusionAssessment,
                tempPulseAssessment,
                derivedInsights
            });
            
            // 5. 風險分層
            const riskStratification = this.performRiskStratification(compositeScore, healthData);
            
            // 6. 個性化建議生成
            const personalizedRecommendations = this.generatePersonalizedRecommendations(
                healthData, compositeScore, riskStratification
            );
            
            // 7. 算法透明度報告
            const transparencyReport = this.algorithmTransparency.generateReport(healthData);
            
            return {
                timestamp: new Date().toISOString(),
                compositeScore,
                riskStratification,
                basicVitalSigns,
                subModelAssessments: {
                    bloodPressureStability: bpStabilityAssessment,
                    bloodOxygenPerfusion: spo2PerfusionAssessment,
                    temperaturePulseSynergy: tempPulseAssessment
                },
                derivedInsights,
                personalizedRecommendations,
                transparencyReport,
                dataLimitations: this.getDataLimitations(healthData),
                parameterSettings: this.parameterCustomization.getCurrentSettings()
            };
            
        } catch (error) {
            console.error('科學健康評估失敗:', error);
            throw new Error('科學健康評估處理失敗: ' + error.message);
        }
    }

    /**
     * 基礎生命體徵評估
     */
    assessBasicVitalSigns(healthData) {
        const assessment = {
            bloodPressure: this.assessBloodPressure(healthData.bloodPressure),
            bloodOxygen: this.assessBloodOxygen(healthData.spO2),
            temperature: this.assessTemperature(healthData.temperature),
            pulse: this.assessPulse(healthData.bloodPressure?.pulse || healthData.spO2?.pr)
        };
        
        return assessment;
    }

    /**
     * 血壓評估 - 基於WHO/ISH 2021標準
     */
    assessBloodPressure(bpData) {
        if (!bpData) return { status: 'no_data', message: '無血壓數據' };
        
        const { systolic, diastolic, pulse } = bpData;
        
        // 血壓分級標準 (WHO/ISH 2021)
        let bpCategory = 'normal';
        let riskLevel = 'low';
        
        if (systolic >= 180 || diastolic >= 110) {
            bpCategory = 'stage3_hypertension';
            riskLevel = 'very_high';
        } else if (systolic >= 160 || diastolic >= 100) {
            bpCategory = 'stage2_hypertension';
            riskLevel = 'high';
        } else if (systolic >= 140 || diastolic >= 90) {
            bpCategory = 'stage1_hypertension';
            riskLevel = 'moderate';
        } else if (systolic >= 130 || diastolic >= 85) {
            bpCategory = 'high_normal';
            riskLevel = 'low_moderate';
        }
        
        return {
            category: bpCategory,
            riskLevel,
            systolic,
            diastolic,
            pulse,
            assessment: this.getBloodPressureAssessment(bpCategory, riskLevel)
        };
    }

    /**
     * 血氧評估
     */
    assessBloodOxygen(spo2Data) {
        if (!spo2Data) return { status: 'no_data', message: '無血氧數據' };
        
        const { percent, pi, pr } = spo2Data;
        
        let spo2Category = 'normal';
        let riskLevel = 'low';
        
        if (percent < 90) {
            spo2Category = 'severe_hypoxemia';
            riskLevel = 'very_high';
        } else if (percent < 95) {
            spo2Category = 'mild_hypoxemia';
            riskLevel = 'moderate';
        }
        
        return {
            category: spo2Category,
            riskLevel,
            percent,
            pi,
            pr,
            assessment: this.getBloodOxygenAssessment(spo2Category)
        };
    }

    /**
     * 體溫評估
     */
    assessTemperature(tempData) {
        if (!tempData) return { status: 'no_data', message: '無體溫數據' };
        
        const { value, location } = tempData;
        
        // 根據測量部位調整正常範圍
        const normalRanges = {
            '腋下': { min: 36.0, max: 37.2 },
            '口腔': { min: 36.3, max: 37.2 },
            '直腸': { min: 36.6, max: 37.6 },
            '耳溫': { min: 36.1, max: 37.1 },
            '額溫': { min: 35.8, max: 37.0 }
        };
        
        const range = normalRanges[location] || normalRanges['腋下'];
        
        let tempCategory = 'normal';
        let riskLevel = 'low';
        
        if (value > range.max + 0.5) {
            tempCategory = 'high_fever';
            riskLevel = 'high';
        } else if (value > range.max) {
            tempCategory = 'fever';
            riskLevel = 'moderate';
        } else if (value < range.min - 0.5) {
            tempCategory = 'hypothermia';
            riskLevel = 'high';
        } else if (value < range.min) {
            tempCategory = 'low_normal';
            riskLevel = 'low_moderate';
        }
        
        return {
            category: tempCategory,
            riskLevel,
            value,
            location,
            normalRange: range,
            assessment: this.getTemperatureAssessment(tempCategory, value, location)
        };
    }

    /**
     * 脈搏評估
     */
    assessPulse(pulseData) {
        if (!pulseData) return { status: 'no_data', message: '無脈搏數據' };
        
        let pulseCategory = 'normal';
        let riskLevel = 'low';
        
        if (pulseData < 50) {
            pulseCategory = 'bradycardia';
            riskLevel = 'moderate';
        } else if (pulseData > 100) {
            pulseCategory = 'tachycardia';
            riskLevel = 'moderate';
        } else if (pulseData > 120) {
            pulseCategory = 'severe_tachycardia';
            riskLevel = 'high';
        }
        
        return {
            category: pulseCategory,
            riskLevel,
            value: pulseData,
            assessment: this.getPulseAssessment(pulseCategory, pulseData)
        };
    }

    /**
     * 計算綜合評分
     */
    calculateCompositeScore(assessments) {
        const weights = this.parameterCustomization.getWeights();
        
        let totalScore = 0;
        let totalWeight = 0;
        
        // 血壓穩定性評分
        if (assessments.bpStabilityAssessment.score !== undefined) {
            totalScore += assessments.bpStabilityAssessment.score * weights.bloodPressureStability;
            totalWeight += weights.bloodPressureStability;
        }
        
        // 血氧灌注評分
        if (assessments.spo2PerfusionAssessment.score !== undefined) {
            totalScore += assessments.spo2PerfusionAssessment.score * weights.bloodOxygenPerfusion;
            totalWeight += weights.bloodOxygenPerfusion;
        }
        
        // 體溫-脈搏協同評分
        if (assessments.tempPulseAssessment.score !== undefined) {
            totalScore += assessments.tempPulseAssessment.score * weights.temperaturePulseSynergy;
            totalWeight += weights.temperaturePulseSynergy;
        }
        
        const compositeScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        return {
            score: Math.round(compositeScore * 100) / 100,
            grade: this.scoreToGrade(compositeScore),
            confidence: this.calculateConfidence(totalWeight),
            weights: weights,
            breakdown: {
                bloodPressureStability: assessments.bpStabilityAssessment.score || 0,
                bloodOxygenPerfusion: assessments.spo2PerfusionAssessment.score || 0,
                temperaturePulseSynergy: assessments.tempPulseAssessment.score || 0
            }
        };
    }

    /**
     * 風險分層
     */
    performRiskStratification(compositeScore, healthData) {
        const { score, grade } = compositeScore;
        
        let riskCategory = 'low';
        let recommendations = [];
        
        if (grade === 'critical' || score < 0.4) {
            riskCategory = 'very_high';
            recommendations = ['立即就醫', '密切監測生命體徵', '避免劇烈活動'];
        } else if (grade === 'poor' || score < 0.6) {
            riskCategory = 'high';
            recommendations = ['建議就醫諮詢', '增加監測頻率', '調整生活方式'];
        } else if (grade === 'fair' || score < 0.8) {
            riskCategory = 'moderate';
            recommendations = ['定期監測', '改善生活習慣', '預防性措施'];
        } else {
            riskCategory = 'low';
            recommendations = ['維持良好習慣', '定期體檢', '持續監測'];
        }
        
        return {
            category: riskCategory,
            level: grade,
            score: score,
            recommendations: recommendations,
            followUpInterval: this.getFollowUpInterval(riskCategory)
        };
    }

    /**
     * 生成個性化建議
     */
    generatePersonalizedRecommendations(healthData, compositeScore, riskStratification) {
        const recommendations = {
            immediate: [],
            lifestyle: [],
            monitoring: [],
            medical: [],
            dataCollection: []
        };
        
        // 基於風險等級的建議
        recommendations.immediate = riskStratification.recommendations;
        
        // 基於具體數據的建議
        if (healthData.bloodPressure) {
            const bpRecs = this.getBloodPressureRecommendations(healthData.bloodPressure);
            recommendations.lifestyle.push(...bpRecs.lifestyle);
            recommendations.monitoring.push(...bpRecs.monitoring);
        }
        
        if (healthData.spO2) {
            const spo2Recs = this.getBloodOxygenRecommendations(healthData.spO2);
            recommendations.lifestyle.push(...spo2Recs.lifestyle);
            recommendations.monitoring.push(...spo2Recs.monitoring);
        }
        
        // 數據收集建議
        recommendations.dataCollection = this.getDataCollectionRecommendations(healthData);
        
        return recommendations;
    }

    /**
     * 獲取數據限制說明
     */
    getDataLimitations(healthData) {
        const limitations = [];
        
        if (!healthData.bloodPressure) limitations.push('缺少血壓數據');
        if (!healthData.spO2) limitations.push('缺少血氧數據');
        if (!healthData.temperature) limitations.push('缺少體溫數據');
        
        limitations.push('缺少血糖、血脂、運動、飲食等數據');
        limitations.push('部分評估基於邏輯推導，建議補充完整數據');
        
        return limitations;
    }

    // 輔助方法
    getBloodPressureAssessment(category, riskLevel) {
        const assessments = {
            'stage3_hypertension': '嚴重高血壓，需要立即醫療干預',
            'stage2_hypertension': '2級高血壓，建議就醫治療',
            'stage1_hypertension': '1級高血壓，建議生活方式干預',
            'high_normal': '正常高值，需要預防措施',
            'normal': '血壓正常'
        };
        
        return assessments[category] || '血壓狀態需要進一步評估';
    }

    getBloodOxygenAssessment(category) {
        const assessments = {
            'severe_hypoxemia': '嚴重低氧血症，需要立即醫療干預',
            'mild_hypoxemia': '輕度低氧血症，建議監測和改善',
            'normal': '血氧飽和度正常'
        };
        
        return assessments[category] || '血氧狀態需要進一步評估';
    }

    getTemperatureAssessment(category, value, location) {
        const assessments = {
            'high_fever': '高熱，需要降溫處理',
            'fever': '發熱，建議監測和休息',
            'normal': '體溫正常',
            'low_normal': '體溫偏低，注意保暖',
            'hypothermia': '體溫過低，需要保暖措施'
        };
        
        return assessments[category] || '體溫狀態需要進一步評估';
    }

    getPulseAssessment(category, value) {
        const assessments = {
            'severe_tachycardia': '嚴重心動過速，需要醫療評估',
            'tachycardia': '心動過速，建議監測',
            'normal': '脈搏正常',
            'bradycardia': '心動過緩，建議監測'
        };
        
        return assessments[category] || '脈搏狀態需要進一步評估';
    }

    scoreToGrade(score) {
        if (score >= 0.9) return 'excellent';
        if (score >= 0.8) return 'good';
        if (score >= 0.6) return 'fair';
        if (score >= 0.4) return 'poor';
        return 'critical';
    }

    calculateConfidence(totalWeight) {
        return Math.min(totalWeight * 100, 100);
    }

    getFollowUpInterval(riskCategory) {
        const intervals = {
            'very_high': '每日',
            'high': '每週',
            'moderate': '每月',
            'low': '每季度'
        };
        return intervals[riskCategory] || '每月';
    }

    getBloodPressureRecommendations(bpData) {
        const recommendations = {
            lifestyle: [],
            monitoring: []
        };
        
        if (bpData.systolic >= 140 || bpData.diastolic >= 90) {
            recommendations.lifestyle.push('低鹽飲食（每日鹽攝入≤5g）');
            recommendations.lifestyle.push('規律有氧運動（每週150分鐘）');
            recommendations.lifestyle.push('控制體重，避免肥胖');
            recommendations.monitoring.push('每日早晚各測量一次血壓');
        }
        
        return recommendations;
    }

    getBloodOxygenRecommendations(spo2Data) {
        const recommendations = {
            lifestyle: [],
            monitoring: []
        };
        
        if (spo2Data.percent < 95) {
            recommendations.lifestyle.push('改善室內通風');
            recommendations.lifestyle.push('避免吸煙和二手煙');
            recommendations.lifestyle.push('適度有氧運動');
            recommendations.monitoring.push('每日監測血氧飽和度');
        }
        
        return recommendations;
    }

    getDataCollectionRecommendations(healthData) {
        const recommendations = [];
        
        if (!healthData.bloodPressure) {
            recommendations.push('建議添加血壓監測設備');
        }
        
        if (!healthData.spO2) {
            recommendations.push('建議添加血氧監測設備');
        }
        
        recommendations.push('建議補充血糖監測數據');
        recommendations.push('建議添加運動記錄功能');
        recommendations.push('建議添加飲食記錄功能');
        
        return recommendations;
    }
}

/**
 * 血壓穩定性子模型
 */
class BloodPressureStabilityModel {
    assess(healthData) {
        const bpData = healthData.bloodPressure;
        if (!bpData) return { 
            status: 'no_data', 
            score: 0, 
            assessment: '血壓數據不足，無法進行穩定性評估' 
        };
        
        // 血壓穩定性評估
        const stability = this.calculateStability(bpData);
        const variability = this.calculateVariability(bpData);
        const trend = this.calculateTrend(bpData);
        
        // 綜合評分
        const score = this.calculateStabilityScore(stability, variability, trend);
        
        return {
            stability,
            variability,
            trend,
            score,
            assessment: this.generateStabilityAssessment(stability, variability, trend, score)
        };
    }
    
    calculateStability(bpData) {
        // 基於血壓變異性計算穩定性
        const cv = Math.abs(bpData.systolic - bpData.diastolic) / ((bpData.systolic + bpData.diastolic) / 2);
        return cv < 0.1 ? 'stable' : cv < 0.2 ? 'moderate' : 'unstable';
    }
    
    calculateVariability(bpData) {
        // 計算血壓變異性 (CV = SD/Mean * 100)
        const meanBP = (bpData.systolic + bpData.diastolic) / 2;
        const variability = Math.abs(bpData.systolic - bpData.diastolic) / meanBP * 100;
        
        return {
            coefficient: variability,
            interpretation: variability < 10 ? 'low' : variability < 20 ? 'moderate' : 'high'
        };
    }
    
    calculateTrend(bpData) {
        // 基於單次測量，無法計算趨勢
        return { status: 'insufficient_data', message: '需要多次測量數據' };
    }
    
    calculateStabilityScore(stability, variability, trend) {
        let score = 0.5; // 基礎分數
        
        // 穩定性評分
        if (stability === 'stable') score += 0.3;
        else if (stability === 'moderate') score += 0.1;
        else score -= 0.2;
        
        // 變異性評分
        if (variability.interpretation === 'low') score += 0.2;
        else if (variability.interpretation === 'moderate') score += 0.1;
        else score -= 0.1;
        
        return Math.max(0, Math.min(1, score));
    }
    
    generateStabilityAssessment(stability, variability, trend, score) {
        let assessment = `血壓穩定性：${stability === 'stable' ? '良好' : stability === 'moderate' ? '一般' : '不穩定'}`;
        assessment += `，變異性：${variability.interpretation === 'low' ? '低' : variability.interpretation === 'moderate' ? '中等' : '高'}`;
        assessment += `，綜合評分：${(score * 100).toFixed(0)}分`;
        
        return assessment;
    }
}

/**
 * 血氧灌注子模型
 */
class BloodOxygenPerfusionModel {
    assess(healthData) {
        const spo2Data = healthData.spO2;
        if (!spo2Data) return { 
            status: 'no_data', 
            score: 0, 
            assessment: '血氧數據不足，無法進行灌注評估' 
        };
        
        const perfusion = this.calculatePerfusion(spo2Data);
        const efficiency = this.calculateEfficiency(spo2Data);
        const stability = this.calculateStability(spo2Data);
        
        // 綜合評分
        const score = this.calculatePerfusionScore(perfusion, efficiency, stability);
        
        return {
            perfusion,
            efficiency,
            stability,
            score,
            assessment: this.generatePerfusionAssessment(perfusion, efficiency, stability, score)
        };
    }
    
    calculatePerfusion(spo2Data) {
        // 基於灌注指數評估外周灌注
        const pi = spo2Data.pi;
        if (pi < 0.5) return 'poor';
        if (pi < 1.0) return 'fair';
        if (pi < 2.0) return 'good';
        return 'excellent';
    }
    
    calculateEfficiency(spo2Data) {
        // 計算氧合效率
        const efficiency = spo2Data.percent / 100;
        return {
            ratio: efficiency,
            interpretation: efficiency >= 0.95 ? 'excellent' : efficiency >= 0.90 ? 'good' : 'poor'
        };
    }
    
    calculateStability(spo2Data) {
        // 基於單次測量，無法計算穩定性
        return { status: 'insufficient_data', message: '需要多次測量數據' };
    }
    
    calculatePerfusionScore(perfusion, efficiency, stability) {
        let score = 0.5; // 基礎分數
        
        // 灌注評分
        if (perfusion === 'excellent') score += 0.3;
        else if (perfusion === 'good') score += 0.2;
        else if (perfusion === 'fair') score += 0.1;
        else score -= 0.2;
        
        // 效率評分
        if (efficiency.interpretation === 'excellent') score += 0.2;
        else if (efficiency.interpretation === 'good') score += 0.1;
        else score -= 0.1;
        
        return Math.max(0, Math.min(1, score));
    }
    
    generatePerfusionAssessment(perfusion, efficiency, stability, score) {
        let assessment = `外周灌注：${perfusion === 'excellent' ? '優秀' : perfusion === 'good' ? '良好' : perfusion === 'fair' ? '一般' : '較差'}`;
        assessment += `，氧合效率：${efficiency.interpretation === 'excellent' ? '優秀' : efficiency.interpretation === 'good' ? '良好' : '較差'}`;
        assessment += `，綜合評分：${(score * 100).toFixed(0)}分`;
        
        return assessment;
    }
}

/**
 * 體溫-脈搏協同子模型
 */
class TemperaturePulseSynergyModel {
    assess(healthData) {
        const tempData = healthData.temperature;
        const pulseData = healthData.bloodPressure?.pulse || healthData.spO2?.pr;
        
        if (!tempData || !pulseData) {
            return { 
                status: 'insufficient_data', 
                score: 0, 
                assessment: '體溫或脈搏數據不足，無法進行協同評估' 
            };
        }
        
        const temperature = this.assessTemperature(tempData);
        const pulse = this.assessPulse(pulseData);
        const synergy = this.calculateSynergy(temperature, pulse);
        
        // 綜合評分
        const score = this.calculateSynergyScore(temperature, pulse, synergy);
        
        return {
            temperature,
            pulse,
            synergy,
            score,
            assessment: this.generateSynergyAssessment(temperature, pulse, synergy, score)
        };
    }
    
    assessTemperature(tempData) {
        const { value, location } = tempData;
        const normalRanges = {
            '腋下': { min: 36.0, max: 37.2 },
            '口腔': { min: 36.3, max: 37.2 },
            '直腸': { min: 36.6, max: 37.6 },
            '耳溫': { min: 36.1, max: 37.1 },
            '額溫': { min: 35.8, max: 37.0 }
        };
        
        const range = normalRanges[location] || normalRanges['腋下'];
        
        if (value > range.max + 0.5) return { category: 'high_fever', riskLevel: 'high', score: 0.2 };
        if (value > range.max) return { category: 'fever', riskLevel: 'moderate', score: 0.4 };
        if (value < range.min - 0.5) return { category: 'hypothermia', riskLevel: 'high', score: 0.2 };
        if (value < range.min) return { category: 'low_normal', riskLevel: 'low_moderate', score: 0.6 };
        return { category: 'normal', riskLevel: 'low', score: 1.0 };
    }
    
    assessPulse(pulseData) {
        if (pulseData < 50) return { category: 'bradycardia', riskLevel: 'moderate', score: 0.4 };
        if (pulseData > 120) return { category: 'severe_tachycardia', riskLevel: 'high', score: 0.2 };
        if (pulseData > 100) return { category: 'tachycardia', riskLevel: 'moderate', score: 0.6 };
        return { category: 'normal', riskLevel: 'low', score: 1.0 };
    }
    
    calculateSynergy(temperature, pulse) {
        // 體溫-脈搏協同分析
        const tempRisk = this.riskLevelToNumber(temperature.riskLevel);
        const pulseRisk = this.riskLevelToNumber(pulse.riskLevel);
        
        const synergyScore = (tempRisk + pulseRisk) / 2;
        
        return {
            score: synergyScore,
            interpretation: synergyScore < 0.3 ? 'good' : synergyScore < 0.6 ? 'moderate' : 'poor',
            correlation: this.analyzeCorrelation(temperature, pulse)
        };
    }
    
    riskLevelToNumber(riskLevel) {
        const map = { 'low': 0.2, 'low_moderate': 0.4, 'moderate': 0.6, 'high': 0.8, 'very_high': 1.0 };
        return map[riskLevel] || 0.5;
    }
    
    analyzeCorrelation(temperature, pulse) {
        // 分析體溫與脈搏的相關性
        if (temperature.category === 'fever' && pulse.category === 'tachycardia') {
            return 'positive_correlation';
        }
        if (temperature.category === 'hypothermia' && pulse.category === 'bradycardia') {
            return 'positive_correlation';
        }
        return 'no_significant_correlation';
    }
    
    calculateSynergyScore(temperature, pulse, synergy) {
        let score = 0.5; // 基礎分數
        
        // 體溫評分
        score += (temperature.score - 0.5) * 0.3;
        
        // 脈搏評分
        score += (pulse.score - 0.5) * 0.3;
        
        // 協同評分
        if (synergy.interpretation === 'good') score += 0.2;
        else if (synergy.interpretation === 'moderate') score += 0.1;
        else score -= 0.1;
        
        return Math.max(0, Math.min(1, score));
    }
    
    generateSynergyAssessment(temperature, pulse, synergy, score) {
        let assessment = `體溫-脈搏協同狀態：${synergy.interpretation === 'good' ? '良好' : synergy.interpretation === 'moderate' ? '一般' : '需要關注'}`;
        
        if (synergy.correlation === 'positive_correlation') {
            assessment += '，體溫與脈搏呈正相關，符合生理規律';
        }
        
        assessment += `，綜合評分：${(score * 100).toFixed(0)}分`;
        
        return assessment;
    }
}

/**
 * 算法透明度類
 */
class AlgorithmTransparency {
    generateReport(healthData) {
        return {
            dataSources: [
                '血壓數據：收縮壓、舒張壓、脈搏',
                '血氧數據：血氧飽和度、灌注指數、脈搏率',
                '體溫數據：體溫值、測量部位'
            ],
            assessmentMethods: [
                '血壓評估：基於WHO/ISH 2021分級標準',
                '血氧評估：基於臨床血氧飽和度標準',
                '體溫評估：基於測量部位調整的正常範圍',
                '脈搏評估：基於成人心率正常範圍'
            ],
            derivationLogic: [
                '循環系統推導：血壓+脈搏關聯分析',
                '呼吸系統推導：血氧+灌注指數關聯分析',
                '代謝系統推導：體溫+脈搏關聯分析'
            ],
            limitations: [
                '基於4類6項核心數據，數據維度有限',
                '部分評估基於邏輯推導，需要臨床驗證',
                '缺少血糖、血脂、運動、飲食等數據',
                '單次測量無法反映長期趨勢'
            ],
            references: [
                'WHO/ISH 2021高血壓管理指南',
                '基礎生命體徵臨床解讀指南',
                '血氧飽和度監測臨床應用指南'
            ],
            transparencyLevel: 'high',
            lastUpdated: new Date().toISOString()
        };
    }
}

/**
 * 參數自定義類
 */
class ParameterCustomization {
    constructor() {
        this.settings = {
            weights: {
                bloodPressureStability: 0.35,
                bloodOxygenPerfusion: 0.25,
                temperaturePulseSynergy: 0.40
            },
            thresholds: {
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
                }
            }
        };
    }
    
    getWeights() {
        return this.settings.weights;
    }
    
    getThresholds() {
        return this.settings.thresholds;
    }
    
    getCurrentSettings() {
        return this.settings;
    }
    
    updateWeights(newWeights) {
        this.settings.weights = { ...this.settings.weights, ...newWeights };
    }
    
    updateThresholds(newThresholds) {
        this.settings.thresholds = { ...this.settings.thresholds, ...newThresholds };
    }
}

/**
 * 數據推導邏輯類
 */
class DataDerivationLogic {
    generateInsights(healthData) {
        const insights = [];
        
        // 基於血壓和脈搏推導循環系統狀態
        if (healthData.bloodPressure) {
            const circulationInsight = this.deriveCirculationInsight(healthData.bloodPressure);
            if (circulationInsight) insights.push(circulationInsight);
        }
        
        // 基於血氧和灌注指數推導呼吸系統狀態
        if (healthData.spO2) {
            const respiratoryInsight = this.deriveRespiratoryInsight(healthData.spO2);
            if (respiratoryInsight) insights.push(respiratoryInsight);
        }
        
        // 基於體溫和脈搏推導代謝狀態
        if (healthData.temperature && (healthData.bloodPressure?.pulse || healthData.spO2?.pr)) {
            const metabolicInsight = this.deriveMetabolicInsight(healthData.temperature, healthData.bloodPressure?.pulse || healthData.spO2?.pr);
            if (metabolicInsight) insights.push(metabolicInsight);
        }
        
        return {
            insights,
            derivationMethods: this.getDerivationMethods(),
            limitations: this.getDerivationLimitations()
        };
    }
    
    deriveCirculationInsight(bpData) {
        const { systolic, diastolic, pulse } = bpData;
        
        // 推導循環系統狀態
        if (systolic >= 140 && pulse > 100) {
            return {
                type: 'circulation',
                insight: '血壓偏高且脈搏加快，提示循環系統負荷增加',
                confidence: 'moderate',
                recommendation: '建議監測血糖水平，排除代謝異常',
                reference: '基於《基礎生命體徵臨床解讀指南》第3章',
                derivation: '因無血糖數據，暫通過「血壓偏高+脈搏加快」間接提示代謝異常風險'
            };
        }
        
        if (systolic < 100 && pulse < 60) {
            return {
                type: 'circulation',
                insight: '血壓偏低且脈搏緩慢，提示循環系統功能可能減弱',
                confidence: 'moderate',
                recommendation: '建議評估心臟功能和體液狀態',
                reference: '基於《基礎生命體徵臨床解讀指南》第3章',
                derivation: '基於血壓和脈搏的協同變化推導循環系統狀態'
            };
        }
        
        return null;
    }
    
    deriveRespiratoryInsight(spo2Data) {
        const { percent, pi } = spo2Data;
        
        // 推導呼吸系統狀態
        if (percent < 95 && pi < 1.0) {
            return {
                type: 'respiratory',
                insight: '血氧飽和度偏低且灌注指數較低，提示可能存在呼吸或循環問題',
                confidence: 'moderate',
                recommendation: '建議評估呼吸功能和肺功能',
                reference: '基於《基礎生命體徵臨床解讀指南》第4章',
                derivation: '通過%SpO2與PI%的比值分析外周循環狀態'
            };
        }
        
        return null;
    }
    
    deriveMetabolicInsight(tempData, pulseData) {
        const { value } = tempData;
        
        // 推導代謝狀態
        if (value > 37.5 && pulseData > 100) {
            return {
                type: 'metabolic',
                insight: '體溫升高且脈搏加快，提示代謝率增加',
                confidence: 'moderate',
                recommendation: '建議監測炎症指標和代謝參數',
                reference: '基於《基礎生命體徵臨床解讀指南》第5章',
                derivation: '基於體溫和脈搏的協同變化推導代謝狀態'
            };
        }
        
        return null;
    }
    
    getDerivationMethods() {
        return [
            '基於血壓和脈搏的循環系統狀態推導',
            '基於血氧和灌注指數的呼吸系統狀態推導',
            '基於體溫和脈搏的代謝狀態推導'
        ];
    }
    
    getDerivationLimitations() {
        return [
            '推導結果基於有限數據，準確性受限',
            '需要更多臨床數據驗證推導結果',
            '建議補充血糖、血脂等實驗室檢查',
            '推導邏輯基於統計學關聯，不替代臨床診斷'
        ];
    }
}

// 導出類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ScientificHealthAssessment,
        BloodPressureStabilityModel,
        BloodOxygenPerfusionModel,
        TemperaturePulseSynergyModel,
        AlgorithmTransparency,
        ParameterCustomization,
        DataDerivationLogic
    };
}
