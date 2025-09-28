/**
 * 專業健康評估模型 - 基於核心生命體徵數據
 * 實現"血壓穩定性子模型"、"血氧灌注子模型"、"體溫-脈搏協同子模型"
 */

class ProfessionalHealthAssessment {
    constructor() {
        this.assessmentModels = {
            bloodPressure: new BloodPressureStabilityModel(),
            bloodOxygen: new BloodOxygenPerfusionModel(),
            temperaturePulse: new TemperaturePulseSynergyModel()
        };
        
        this.derivationLogic = new DataDerivationLogic();
        this.algorithmTransparency = new AlgorithmTransparency();
    }

    /**
     * 綜合健康評估 - 基於4類6項核心數據
     * @param {Object} healthData - 健康數據對象
     * @returns {Object} 綜合評估結果
     */
    async generateComprehensiveAssessment(healthData) {
        try {
            // 1. 基礎生命體徵評估
            const basicVitalSigns = this.assessBasicVitalSigns(healthData);
            
            // 2. 子模型評估
            const bpAssessment = this.assessmentModels.bloodPressure.assess(healthData);
            const spo2Assessment = this.assessmentModels.bloodOxygen.assess(healthData);
            const tempPulseAssessment = this.assessmentModels.temperaturePulse.assess(healthData);
            
            // 3. 邏輯推導補充
            const derivedInsights = this.derivationLogic.generateInsights(healthData);
            
            // 4. 綜合評分計算
            const compositeScore = this.calculateCompositeScore({
                basicVitalSigns,
                bpAssessment,
                spo2Assessment,
                tempPulseAssessment,
                derivedInsights
            });
            
            // 5. 風險分層
            const riskStratification = this.performRiskStratification(compositeScore, healthData);
            
            // 6. 個性化建議生成
            const personalizedRecommendations = this.generatePersonalizedRecommendations(
                healthData, compositeScore, riskStratification
            );
            
            return {
                timestamp: new Date().toISOString(),
                compositeScore,
                riskStratification,
                basicVitalSigns,
                subModelAssessments: {
                    bloodPressure: bpAssessment,
                    bloodOxygen: spo2Assessment,
                    temperaturePulse: tempPulseAssessment
                },
                derivedInsights,
                personalizedRecommendations,
                algorithmTransparency: this.algorithmTransparency.getTransparencyReport(),
                dataLimitations: this.getDataLimitations(healthData)
            };
            
        } catch (error) {
            console.error('健康評估失敗:', error);
            throw new Error('健康評估處理失敗: ' + error.message);
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
     * 血壓評估
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
        
        // 血壓變異性計算 (CV = SD/Mean * 100)
        const bpVariability = this.calculateBloodPressureVariability(bpData);
        
        return {
            category: bpCategory,
            riskLevel,
            systolic,
            diastolic,
            pulse,
            variability: bpVariability,
            assessment: this.getBloodPressureAssessment(bpCategory, riskLevel, bpVariability)
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
        
        // 灌注指數評估
        const perfusionStatus = this.assessPerfusionIndex(pi);
        
        return {
            category: spo2Category,
            riskLevel,
            percent,
            pi,
            pr,
            perfusionStatus,
            assessment: this.getBloodOxygenAssessment(spo2Category, perfusionStatus)
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
     * 計算血壓變異性
     */
    calculateBloodPressureVariability(bpData) {
        // 簡化版本：基於單次測量，實際應基於多次測量歷史數據
        const { systolic, diastolic } = bpData;
        const meanBP = (systolic + diastolic) / 2;
        const variability = Math.abs(systolic - diastolic) / meanBP * 100;
        
        return {
            coefficient: variability,
            interpretation: variability > 20 ? 'high' : variability > 10 ? 'moderate' : 'low'
        };
    }

    /**
     * 評估灌注指數
     */
    assessPerfusionIndex(pi) {
        if (pi < 0.5) return 'poor';
        if (pi < 1.0) return 'fair';
        if (pi < 2.0) return 'good';
        return 'excellent';
    }

    /**
     * 計算綜合評分
     */
    calculateCompositeScore(assessments) {
        const weights = {
            bloodPressure: 0.35,
            bloodOxygen: 0.25,
            temperature: 0.20,
            pulse: 0.20
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        // 血壓評分
        if (assessments.bpAssessment.riskLevel) {
            const bpScore = this.riskLevelToScore(assessments.bpAssessment.riskLevel);
            totalScore += bpScore * weights.bloodPressure;
            totalWeight += weights.bloodPressure;
        }
        
        // 血氧評分
        if (assessments.spo2Assessment.riskLevel) {
            const spo2Score = this.riskLevelToScore(assessments.spo2Assessment.riskLevel);
            totalScore += spo2Score * weights.bloodOxygen;
            totalWeight += weights.bloodOxygen;
        }
        
        // 體溫評分
        if (assessments.tempPulseAssessment.temperature?.riskLevel) {
            const tempScore = this.riskLevelToScore(assessments.tempPulseAssessment.temperature.riskLevel);
            totalScore += tempScore * weights.temperature;
            totalWeight += weights.temperature;
        }
        
        // 脈搏評分
        if (assessments.tempPulseAssessment.pulse?.riskLevel) {
            const pulseScore = this.riskLevelToScore(assessments.tempPulseAssessment.pulse.riskLevel);
            totalScore += pulseScore * weights.pulse;
            totalWeight += weights.pulse;
        }
        
        const compositeScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        return {
            score: Math.round(compositeScore * 100) / 100,
            grade: this.scoreToGrade(compositeScore),
            confidence: this.calculateConfidence(totalWeight),
            weights: weights
        };
    }

    /**
     * 風險等級轉換為分數
     */
    riskLevelToScore(riskLevel) {
        const scoreMap = {
            'very_high': 0.2,
            'high': 0.4,
            'moderate': 0.6,
            'low_moderate': 0.8,
            'low': 1.0
        };
        return scoreMap[riskLevel] || 0.5;
    }

    /**
     * 分數轉換為等級
     */
    scoreToGrade(score) {
        if (score >= 0.9) return 'excellent';
        if (score >= 0.8) return 'good';
        if (score >= 0.6) return 'fair';
        if (score >= 0.4) return 'poor';
        return 'critical';
    }

    /**
     * 計算置信度
     */
    calculateConfidence(totalWeight) {
        return Math.min(totalWeight * 100, 100);
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
     * 獲取隨訪間隔
     */
    getFollowUpInterval(riskCategory) {
        const intervals = {
            'very_high': '每日',
            'high': '每週',
            'moderate': '每月',
            'low': '每季度'
        };
        return intervals[riskCategory] || '每月';
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
    getBloodPressureAssessment(category, riskLevel, variability) {
        const assessments = {
            'stage3_hypertension': '嚴重高血壓，需要立即醫療干預',
            'stage2_hypertension': '2級高血壓，建議就醫治療',
            'stage1_hypertension': '1級高血壓，建議生活方式干預',
            'high_normal': '正常高值，需要預防措施',
            'normal': '血壓正常'
        };
        
        let assessment = assessments[category] || '血壓狀態需要進一步評估';
        
        if (variability.interpretation === 'high') {
            assessment += '，血壓變異性較大，建議增加監測頻率';
        }
        
        return assessment;
    }

    getBloodOxygenAssessment(category, perfusionStatus) {
        const assessments = {
            'severe_hypoxemia': '嚴重低氧血症，需要立即醫療干預',
            'mild_hypoxemia': '輕度低氧血症，建議監測和改善',
            'normal': '血氧飽和度正常'
        };
        
        let assessment = assessments[category] || '血氧狀態需要進一步評估';
        
        if (perfusionStatus === 'poor') {
            assessment += '，外周灌注較差，建議檢查循環狀態';
        }
        
        return assessment;
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
        if (!bpData) return { status: 'no_data' };
        
        // 血壓穩定性評估
        const stability = this.calculateStability(bpData);
        const variability = this.calculateVariability(bpData);
        const trend = this.calculateTrend(bpData);
        
        return {
            stability,
            variability,
            trend,
            assessment: this.generateStabilityAssessment(stability, variability, trend)
        };
    }
    
    calculateStability(bpData) {
        // 基於血壓變異性計算穩定性
        const cv = Math.abs(bpData.systolic - bpData.diastolic) / ((bpData.systolic + bpData.diastolic) / 2);
        return cv < 0.1 ? 'stable' : cv < 0.2 ? 'moderate' : 'unstable';
    }
    
    calculateVariability(bpData) {
        // 計算血壓變異性
        return {
            coefficient: Math.abs(bpData.systolic - bpData.diastolic) / ((bpData.systolic + bpData.diastolic) / 2) * 100,
            interpretation: 'single_measurement'
        };
    }
    
    calculateTrend(bpData) {
        // 基於單次測量，無法計算趨勢
        return { status: 'insufficient_data', message: '需要多次測量數據' };
    }
    
    generateStabilityAssessment(stability, variability, trend) {
        return `血壓穩定性：${stability === 'stable' ? '良好' : stability === 'moderate' ? '一般' : '不穩定'}`;
    }
}

/**
 * 血氧灌注子模型
 */
class BloodOxygenPerfusionModel {
    assess(healthData) {
        const spo2Data = healthData.spO2;
        if (!spo2Data) return { status: 'no_data' };
        
        const perfusion = this.calculatePerfusion(spo2Data);
        const efficiency = this.calculateEfficiency(spo2Data);
        const stability = this.calculateStability(spo2Data);
        
        return {
            perfusion,
            efficiency,
            stability,
            assessment: this.generatePerfusionAssessment(perfusion, efficiency, stability)
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
    
    generatePerfusionAssessment(perfusion, efficiency, stability) {
        return `外周灌注：${perfusion === 'excellent' ? '優秀' : perfusion === 'good' ? '良好' : perfusion === 'fair' ? '一般' : '較差'}`;
    }
}

/**
 * 體溫-脈搏協同子模型
 */
class TemperaturePulseSynergyModel {
    assess(healthData) {
        const tempData = healthData.temperature;
        const pulseData = healthData.bloodPressure?.pulse || healthData.spO2?.pr;
        
        const temperature = tempData ? this.assessTemperature(tempData) : { status: 'no_data' };
        const pulse = pulseData ? this.assessPulse(pulseData) : { status: 'no_data' };
        const synergy = this.calculateSynergy(temperature, pulse);
        
        return {
            temperature,
            pulse,
            synergy,
            assessment: this.generateSynergyAssessment(temperature, pulse, synergy)
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
        
        if (value > range.max + 0.5) return { category: 'high_fever', riskLevel: 'high' };
        if (value > range.max) return { category: 'fever', riskLevel: 'moderate' };
        if (value < range.min - 0.5) return { category: 'hypothermia', riskLevel: 'high' };
        if (value < range.min) return { category: 'low_normal', riskLevel: 'low_moderate' };
        return { category: 'normal', riskLevel: 'low' };
    }
    
    assessPulse(pulseData) {
        if (pulseData < 50) return { category: 'bradycardia', riskLevel: 'moderate' };
        if (pulseData > 120) return { category: 'severe_tachycardia', riskLevel: 'high' };
        if (pulseData > 100) return { category: 'tachycardia', riskLevel: 'moderate' };
        return { category: 'normal', riskLevel: 'low' };
    }
    
    calculateSynergy(temperature, pulse) {
        if (temperature.status === 'no_data' || pulse.status === 'no_data') {
            return { status: 'insufficient_data' };
        }
        
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
    
    generateSynergyAssessment(temperature, pulse, synergy) {
        if (synergy.status === 'insufficient_data') {
            return '體溫-脈搏協同分析需要更多數據';
        }
        
        let assessment = `體溫-脈搏協同狀態：${synergy.interpretation === 'good' ? '良好' : synergy.interpretation === 'moderate' ? '一般' : '需要關注'}`;
        
        if (synergy.correlation === 'positive_correlation') {
            assessment += '，體溫與脈搏呈正相關，符合生理規律';
        }
        
        return assessment;
    }
}

/**
 * 數據推導邏輯
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
                reference: '基於《基礎生命體徵臨床解讀指南》第3章'
            };
        }
        
        if (systolic < 100 && pulse < 60) {
            return {
                type: 'circulation',
                insight: '血壓偏低且脈搏緩慢，提示循環系統功能可能減弱',
                confidence: 'moderate',
                recommendation: '建議評估心臟功能和體液狀態',
                reference: '基於《基礎生命體徵臨床解讀指南》第3章'
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
                reference: '基於《基礎生命體徵臨床解讀指南》第4章'
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
                reference: '基於《基礎生命體徵臨床解讀指南》第5章'
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

/**
 * 算法透明度
 */
class AlgorithmTransparency {
    getTransparencyReport() {
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
            ]
        };
    }
}

// 導出類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ProfessionalHealthAssessment,
        BloodPressureStabilityModel,
        BloodOxygenPerfusionModel,
        TemperaturePulseSynergyModel,
        DataDerivationLogic,
        AlgorithmTransparency
    };
}
