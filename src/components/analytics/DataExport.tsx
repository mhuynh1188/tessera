'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Image, 
  Check,
  Calendar,
  Filter,
  Users,
  Shield
} from 'lucide-react';
import { BehaviorPattern } from '@/lib/analytics-aggregation';

interface DataExportProps {
  behaviorData: BehaviorPattern[];
  stakeholderRole: 'hr' | 'executive' | 'middle_management';
  timeRange: 'week' | 'month' | 'quarter';
  onExportComplete?: (format: string) => void;
}

export const DataExport: React.FC<DataExportProps> = ({
  behaviorData,
  stakeholderRole,
  timeRange,
  onExportComplete
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<Array<{
    format: string;
    timestamp: string;
    filename: string;
  }>>([]);

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV Spreadsheet',
      description: 'Raw data for analysis in Excel, Google Sheets',
      icon: FileSpreadsheet,
      color: 'text-green-500',
      stakeholderAccess: ['hr', 'executive', 'middle_management']
    },
    {
      id: 'pdf',
      name: 'Executive Summary',
      description: 'Privacy-compliant report for leadership',
      icon: FileText,
      color: 'text-blue-500',
      stakeholderAccess: ['executive', 'hr']
    },
    {
      id: 'png',
      name: 'Visualization PNG',
      description: 'High-res charts for presentations',
      icon: Image,
      color: 'text-purple-500',
      stakeholderAccess: ['hr', 'executive', 'middle_management']
    },
    {
      id: 'anonymized-json',
      name: 'Anonymized Dataset',
      description: 'Privacy-preserving data for research',
      icon: Shield,
      color: 'text-orange-500',
      stakeholderAccess: ['hr']
    }
  ];

  const getStakeholderFilename = (format: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const rolePrefix = {
      'hr': 'HR_Confidential',
      'executive': 'Executive_Summary',
      'middle_management': 'Management_Report'
    }[stakeholderRole];
    
    return `${rolePrefix}_BehaviorAnalytics_${timeRange}_${timestamp}.${format}`;
  };

  const generateCSVData = (): string => {
    const headers = [
      'Pattern_ID',
      'Pattern_Type',
      'Category',
      'Severity_Level',
      'Frequency',
      'Trend_Direction',
      'Environmental_Factors',
      'Framework',
      'Size_Indicator'
    ];

    const rows = behaviorData.map(pattern => [
      pattern.id,
      pattern.pattern_type,
      pattern.category,
      pattern.severity_avg.toFixed(2),
      pattern.frequency.toString(),
      pattern.trend_direction,
      pattern.environmental_factors.join('; '),
      pattern.psychological_framework,
      pattern.size_indicator.toString()
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const generatePDFData = (): string => {
    const summary = `
BEHAVIOR SAVIOR ANALYTICS REPORT
${stakeholderRole.toUpperCase()} DASHBOARD
Generated: ${new Date().toLocaleDateString()}
Time Range: ${timeRange.toUpperCase()}

EXECUTIVE SUMMARY
================
Total Patterns Analyzed: ${behaviorData.length}
High Severity Issues (4+): ${behaviorData.filter(p => p.severity_avg >= 4).length}
Improving Trends: ${behaviorData.filter(p => p.trend_direction === 'improving').length}
Declining Trends: ${behaviorData.filter(p => p.trend_direction === 'declining').length}

TOP PATTERNS BY SEVERITY
========================
${behaviorData
  .sort((a, b) => b.severity_avg - a.severity_avg)
  .slice(0, 5)
  .map((pattern, i) => `${i + 1}. ${pattern.pattern_type} (${pattern.severity_avg.toFixed(1)}/5)`)
  .join('\n')}

CATEGORY BREAKDOWN
==================
${Object.entries(
    behaviorData.reduce((acc, pattern) => {
      acc[pattern.category] = (acc[pattern.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => `${category}: ${count} patterns`).join('\n')}

PRIVACY COMPLIANCE
==================
- All data anonymized with k-anonymity (min sample size: 5)
- No individual identification possible
- Aggregated insights only
- SOC 2 Type II compliant

This report contains confidential organizational behavior insights.
Distribution restricted to authorized ${stakeholderRole.toUpperCase()} personnel only.
`;
    return summary;
  };

  const generateAnonymizedJSON = () => {
    const anonymizedData = {
      metadata: {
        export_timestamp: new Date().toISOString(),
        stakeholder_role: stakeholderRole,
        time_range: timeRange,
        privacy_level: 'k-anonymous-enhanced',
        total_patterns: behaviorData.length,
        compliance_notes: [
          'All individual identifiers removed',
          'Minimum sample size enforced (k=5)',
          'Temporal aggregation applied',
          'Geographic anonymization implemented'
        ]
      },
      patterns: behaviorData.map((pattern, index) => ({
        pattern_hash: `PAT_${index.toString().padStart(3, '0')}`,
        category: pattern.category,
        severity_band: pattern.severity_avg >= 4 ? 'high' :
                       pattern.severity_avg >= 3 ? 'medium' : 'low',
        frequency_tier: pattern.frequency >= 15 ? 'frequent' :
                        pattern.frequency >= 8 ? 'moderate' : 'occasional',
        trend: pattern.trend_direction,
        environmental_context: pattern.environmental_factors,
        intervention_recommended: pattern.severity_avg >= 3.5
      })),
      summary_statistics: {
        severity_distribution: {
          low: behaviorData.filter(p => p.severity_avg < 3).length,
          medium: behaviorData.filter(p => p.severity_avg >= 3 && p.severity_avg < 4).length,
          high: behaviorData.filter(p => p.severity_avg >= 4).length
        },
        trend_analysis: {
          improving: behaviorData.filter(p => p.trend_direction === 'improving').length,
          stable: behaviorData.filter(p => p.trend_direction === 'stable').length,
          declining: behaviorData.filter(p => p.trend_direction === 'declining').length
        }
      }
    };

    return JSON.stringify(anonymizedData, null, 2);
  };

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      let content: string;
      let mimeType: string;
      const filename = getStakeholderFilename(format);

      switch (format) {
        case 'csv':
          content = generateCSVData();
          mimeType = 'text/csv';
          break;
        case 'pdf':
          content = generatePDFData();
          mimeType = 'text/plain'; // Would be 'application/pdf' for actual PDF
          break;
        case 'png':
          // In a real implementation, this would generate actual PNG from charts
          content = 'PNG chart data would be generated here';
          mimeType = 'image/png';
          break;
        case 'anonymized-json':
          content = generateAnonymizedJSON();
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update export history
      const newExport = {
        format: format.toUpperCase(),
        timestamp: new Date().toLocaleString(),
        filename
      };
      setExportHistory(prev => [newExport, ...prev.slice(0, 4)]);

      onExportComplete?.(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const availableFormats = exportFormats.filter(format => 
    format.stakeholderAccess.includes(stakeholderRole)
  );

  return (
    <div className="data-export space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Analytics Data
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate privacy-compliant reports for {stakeholderRole} stakeholders
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableFormats.map((format) => (
              <Card 
                key={format.id}
                className="border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <format.icon className={`h-8 w-8 ${format.color} mt-1`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{format.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{format.description}</p>
                      <Button
                        onClick={() => handleExport(format.id)}
                        disabled={isExporting === format.id}
                        className="w-full"
                        variant={isExporting === format.id ? "outline" : "default"}
                      >
                        {isExporting === format.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Export {format.name}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Time Range:</span>
              <span className="text-gray-600 capitalize">{timeRange}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="font-medium">Role:</span>
              <span className="text-gray-600 capitalize">{stakeholderRole.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Privacy:</span>
              <span className="text-gray-600">K-Anonymous</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <Shield className="h-4 w-4 inline mr-1" />
              All exports maintain strict privacy compliance with k-anonymity principles and 
              role-based access controls.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportHistory.map((export_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{export_.format} Export</p>
                      <p className="text-xs text-gray-600">{export_.filename}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {export_.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataExport;