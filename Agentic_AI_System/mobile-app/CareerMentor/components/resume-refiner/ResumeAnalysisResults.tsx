import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS } from '@/constants/Colors';
import CategoryItem from './CategoryItem';
import CircularProgress from './CircularProgress';

interface FeedbackMessage {
  section: string;
  text: string;
}

interface ResumeAnalysisResultsProps {
  feedbackMessages: FeedbackMessage[];
  overallScore: number;
  categoryScores?: Record<string, number>;
}

// Interface for parsed feedback item
interface ParsedFeedbackItem {
  header: string | null;
  content: string;
}

const ResumeAnalysisResults: React.FC<ResumeAnalysisResultsProps> = ({
  feedbackMessages,
  overallScore,
  categoryScores = {},
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Debug logs
  console.log('ResumeAnalysisResults - received feedbackMessages:', JSON.stringify(feedbackMessages, null, 2));
  console.log('ResumeAnalysisResults - received overallScore:', overallScore);
  console.log('ResumeAnalysisResults - received categoryScores:', JSON.stringify(categoryScores, null, 2));

  // Define the specific categories we want to display
  const categories = [
    { id: 'format_layout', title: 'Format & Layout', icon: 'grid' },
    { id: 'inhalt_struktur', title: 'Content & Structure', icon: 'albums' },
    { id: 'sprache_stil', title: 'Language & Style', icon: 'chatbubbles' },
    { id: 'ergebnis_orientierung', title: 'Results Orientation', icon: 'bar-chart' }
  ];

  // Group feedback messages by section
  const groupedMessages = feedbackMessages.reduce((acc, message) => {
    const sectionKey = message.section.toLowerCase().replace(' ', '_');
    if (!acc[sectionKey]) {
      acc[sectionKey] = [];
    }
    acc[sectionKey].push(message.text);
    return acc;
  }, {} as Record<string, string[]>);

  // Debug logs for grouped messages
  console.log('ResumeAnalysisResults - grouped messages:', JSON.stringify(groupedMessages, null, 2));

  // Parse feedback text to extract headers and content
  const parseFeedbackText = (text: string): ParsedFeedbackItem => {
    // Check if the text starts with a header pattern "**Text**"
    const headerMatch = text.match(/^\s*\*\*(.*?)\*\*/);
    
    if (headerMatch) {
      const header = headerMatch[1];
      // Remove the header from the content
      let content = text.replace(/^\s*\*\*(.*?)\*\*\s*:?\s*/, '').trim();
      // Remove bullet point if it exists at the beginning
      content = content.replace(/^\s*•\s*/, '').trim();
      return { header, content };
    }
    
    // If no header, just remove bullet point if it exists
    const content = text.replace(/^\s*•\s*/, '').trim();
    return { header: null, content };
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Get section score directly from backend data
  const getSectionScore = (sectionId: string): number => {
    // Use the actual score from backend if available
    if (categoryScores && categoryScores[sectionId] !== undefined) {
      return categoryScores[sectionId];
    }
    
    // Fallback to overall score if specific category score is not available
    return overallScore;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Resume Feedback</Text>
        
        {/* Overall Score Circle - without any text */}
        <View style={styles.overallScoreContainer}>
          <CircularProgress 
            percentage={overallScore} 
            size={120} 
            strokeWidth={12} 
            progressColor={CAREER_COLORS.sky}
          />
        </View>
        
        {/* Category Scores */}
        <View style={styles.feedbackContainer}>
          {categories.map((category) => {
            const sectionScore = getSectionScore(category.id);
            const sectionMessages = groupedMessages[category.id] || [];
            
            return (
              <CategoryItem
                key={category.id}
                title={category.title}
                score={Math.round(sectionScore)} // Round to remove decimal places
                icon={category.icon}
                expanded={expandedSections.includes(category.id)}
                onPress={() => toggleSection(category.id)}
              >
                {sectionMessages.length > 0 ? (
                  <View style={styles.feedbackItemsContainer}>
                    {sectionMessages.map((text, i) => {
                      const { header, content } = parseFeedbackText(text);
                      
                      return (
                        <View key={i} style={styles.feedbackItemContainer}>
                          {header && (
                            <Text style={styles.feedbackHeader}>
                              {header}
                            </Text>
                          )}
                          <Text style={styles.feedbackText}>
                            {content}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.noFeedbackText}>
                    No specific feedback available for this category.
                  </Text>
                )}
              </CategoryItem>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CAREER_COLORS.white,
    margin: -12
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingTop: 12,
    paddingBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: CAREER_COLORS.midnight,
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  feedbackContainer: {
    width: '100%',
  },
  feedbackText: {
    color: CAREER_COLORS.white,
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  noFeedbackText: {
    color: CAREER_COLORS.white,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  feedbackItemsContainer: {
    width: '100%',
  },
  feedbackItemContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  feedbackHeader: {
    color: CAREER_COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
  },
});

export default ResumeAnalysisResults;
