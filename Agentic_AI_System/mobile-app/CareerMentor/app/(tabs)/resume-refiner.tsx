import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, View, Dimensions, SafeAreaView, Animated, Image } from 'react-native';
import { Text } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

// Style Guide Farben
const COLORS = {
  salt: '#EDE6EE',
  lightRose: '#CBB8CB',
  rose: '#C29BB8',
  sky: '#8089B4',
  nightSky: '#5A5D80',
  midnight: '#272727',
  white: '#FFFFFF',
};

// Dummy Jobs für die Match-Seite
const DUMMY_JOBS = [
  {
    id: 'job1',
    title: 'Frontend Developer',
    company: 'TechVision GmbH',
    location: 'München',
    description: `We are looking for a Frontend Developer to join our team in Munich. The ideal candidate should have experience with React, TypeScript, and modern web development practices.

Responsibilities:
- Develop user interfaces using React and TypeScript
- Collaborate with designers to implement UI/UX designs
- Write clean, maintainable, and efficient code
- Optimize applications for maximum speed and scalability

Requirements:
- 2+ years of experience with React
- Strong knowledge of JavaScript/TypeScript
- Experience with responsive design
- Familiarity with RESTful APIs
- Bachelor's degree in Computer Science or related field`,
    logo: 'https://via.placeholder.com/50',
  },
  {
    id: 'job2',
    title: 'Backend Engineer',
    company: 'DataSphere AG',
    location: 'Berlin',
    description: `DataSphere is seeking a talented Backend Engineer to develop robust server-side applications. You'll work with our team to build scalable and maintainable APIs and services.

Responsibilities:
- Design and implement backend services using Node.js and Python
- Create and maintain database schemas and queries
- Develop RESTful APIs for frontend consumption
- Implement security and data protection measures

Requirements:
- 3+ years of experience in backend development
- Proficiency in Node.js, Express, and Python
- Experience with SQL and NoSQL databases
- Knowledge of cloud services (AWS, Azure, or GCP)
- Strong problem-solving skills`,
    logo: 'https://via.placeholder.com/50',
  },
  {
    id: 'job3',
    title: 'Full Stack Developer',
    company: 'InnoSoft Solutions',
    location: 'Hamburg',
    description: `InnoSoft is looking for a Full Stack Developer to join our growing team. You will be responsible for developing and maintaining both frontend and backend components of our web applications.

Responsibilities:
- Develop frontend components using React and Angular
- Build backend services with Node.js and Java
- Design and implement database schemas
- Ensure the technical feasibility of UI/UX designs

Requirements:
- 4+ years of experience in full stack development
- Strong knowledge of JavaScript, HTML, CSS
- Experience with React, Angular, or Vue.js
- Proficiency in Node.js, Express, and Java
- Familiarity with cloud services and DevOps practices`,
    logo: 'https://via.placeholder.com/50',
  },
];

// Circular Progress Component
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 70;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const progress = (100 - percentage) / 100 * circumference;
  
  return (
    <View style={styles.circularProgressContainer}>
      <Svg height="180" width="180" viewBox="0 0 180 180">
        {/* Background Circle */}
        <Circle
          cx="90"
          cy="90"
          r={radius}
          stroke={COLORS.salt} // Salt
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx="90"
          cy="90"
          r={radius}
          stroke={COLORS.nightSky} // Night Sky
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          fill="transparent"
          transform="rotate(-90, 90, 90)"
        />
        {/* Percentage Text */}
        <SvgText
          x="90"
          y="90"
          fontSize="28"
          fontWeight="bold"
          fill={COLORS.nightSky} // Night Sky
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {percentage.toFixed(1)}
        </SvgText>
        <SvgText
          x="90"
          y="115"
          fontSize="14"
          fill="#9370db"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          /100
        </SvgText>
      </Svg>
    </View>
  );
};

// Job Card Component
const JobCard = ({
  job,
  onSelect,
  isSelected
}: {
  job: typeof DUMMY_JOBS[0],
  onSelect: () => void,
  isSelected: boolean
}) => {
  return (
    <TouchableOpacity 
      style={[styles.jobCard, isSelected && styles.selectedJobCard]} 
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.jobCardHeader}>
        <View style={styles.jobLogoContainer}>
          <Image source={{ uri: job.logo }} style={styles.jobLogo} />
        </View>
        <View style={styles.jobInfoContainer}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
          <View style={styles.jobLocationContainer}>
            <Ionicons name="location-outline" size={14} color={COLORS.nightSky} />
            <Text style={styles.jobLocation}>{job.location}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.nightSky} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Category Item Component with Collapsible Feedback
const CategoryItem = ({ 
  title, 
  score, 
  feedback,
  maxScore = 100
}: { 
  title: string, 
  score: number, 
  feedback: Array<{text: string, section: string}>,
  maxScore?: number
}) => {
  const [expanded, setExpanded] = useState(false);
  const scorePercentage = (score / maxScore) * 100;
  
  const getScoreColor = () => {
    if (scorePercentage < 33) return COLORS.rose; // Rose für niedrige Werte
    if (scorePercentage < 66) return COLORS.sky; // Sky für mittlere Werte
    return COLORS.nightSky; // Night Sky für hohe Werte
  };
  
  // Verbesserte Filterung für Feedback-Nachrichten
  const relevantFeedback = feedback.filter(item => {
    // Für Results Orientation
    if (title === "Results Orientation" && 
        (item.section.toLowerCase().includes("ergebnis") || 
         item.section.toLowerCase().includes("result"))) {
      return true;
    }
    // Für Content & Structure (inhalt_struktur)
    if (title === "Content & Structure" &&
        item.section.toLowerCase().includes("content")) {
      return true;
    }
    // Für Language & Style (sprache_stil)
    if (title === "Language & Style" &&
        item.section.toLowerCase().includes("language")) {
      return true;
    }
    // Für andere Kategorien
    return item.section.toLowerCase().includes(title.toLowerCase());
  });
  
  return (
    <View style={styles.categoryItemContainer}>
      <TouchableOpacity 
        style={styles.categoryHeaderItem} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={[styles.categoryScore, {color: getScoreColor()}]}>{score.toFixed(0)}</Text>
        </View>
        <View style={styles.scoreBarOuterContainer}>
          <View style={styles.scoreBarContainerNew}>
            <View 
              style={[styles.scoreBar, {width: `${scorePercentage}%`, backgroundColor: getScoreColor()}]} 
            />
          </View>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6a5acd" 
          />
        </View>
      </TouchableOpacity>
      
      {expanded && relevantFeedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          {relevantFeedback.map((item, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Text style={styles.feedbackText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function ResumeRefinerScreen() {
  console.log("🏁 ResumeRefinerScreen rendered");
  const [uploadStarted, setUploadStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'parsing' | 'analysing' | ''>('parsing');
  const [loadingDots, setLoadingDots] = useState('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [feedbackMessages, setFeedbackMessages] = useState<Array<{text: string, section: string}>>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState<{match_score: number, missing_keywords: string[], suggestions: string[], improvement_suggestions: string[]} | null>(null);
  const [uploadId, setUploadId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analyse' | 'match'>('analyse');
  const [selectedJob, setSelectedJob] = useState<typeof DUMMY_JOBS[0] | null>(null);
  
  // Simulate loading progress
  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>;
    
    if (loading) {
      setLoadingProgress(0);
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          // Ensure progress increases steadily
          const increment = prev < 30 ? 1 : prev < 60 ? 0.7 : prev < 90 ? 0.5 : 0.2;
          const newValue = prev + increment;
          
          if (newValue >= 100) {
            return 99; // Keep at 99% until actually complete
          }
          return newValue;
        });
      }, 200);
    } else {
      setLoadingProgress(0);
      setLoadingStage('');
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading]);
  
  // Animate loading dots
  useEffect(() => {
    let dotsInterval: ReturnType<typeof setInterval>;
    
    if (loading) {
      dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '') return '.';
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '';
        });
      }, 500);
    } else {
      setLoadingDots('');
    }
    
    return () => {
      if (dotsInterval) clearInterval(dotsInterval);
    };
  }, [loading]);
  
  // New state for category scores
  const [categoryScores, setCategoryScores] = useState<{
    format_layout: number;
    inhalt_struktur: number;
    sprache_stil: number;
    ergebnis_orientierung: number;
    overall: number;
  } | null>(null);

  const API_BASE_URL = 'http://localhost:8080';

  const pickAndUpload = async () => {
    console.log("🖱️ Upload button pressed");
    
    try {
      // Launch document picker without setting loading state yet
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      console.log("📄 Picker result:", res);
  
      // Handle new Expo DocumentPicker API
      if (!res.canceled && res.assets && res.assets.length > 0) {
        // Only start loading after user has selected a file
        setLoading(true);
        setLoadingStage('parsing');
        
        const asset = res.assets[0];
        const uri = asset.uri;
        const name = asset.name;
        
        // Speichere den Dateinamen für die Anzeige
        setCurrentFileName(name);
  
        try {
          console.log("📄 Using direct file URI approach for React Native");
          
          // Create FormData with the file directly from URI
          // This is the recommended approach for React Native
          const form = new FormData();
          
          // Use a more explicit way to append the file to FormData for React Native
          form.append('file', {
            uri: uri,
            name: name,
            type: 'application/pdf'
          } as any);
          
          console.log("📄 FormData created with file:", name);
          
          // Upload to backend with explicit headers
          console.log("🔗 POST →", `${API_BASE_URL}/resumes/upload`);
          const resp = await fetch(`${API_BASE_URL}/resumes/upload`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              // Don't set Content-Type when using FormData with files
            },
            body: form,
          });
  
          // Log response for debugging
          console.log("⏳ Upload status:", resp.status);
          const text = await resp.text();
          console.log("📥 Response body:", text);
  
          // Parse JSON and proceed
          const data = JSON.parse(text);
          setUploadId(data.upload_id);
          setUploadStarted(true);
          analyzeResume(data.upload_id);
        } catch (e: any) {
          console.error("File upload error:", e);
          setFeedbackMessages([{ 
            section: 'Error', 
            text: `An error occurred during file upload: ${e?.message || 'Unknown error'}` 
          }]);
        }
      } else {
        // User cancelled the picker, don't show loading
        console.log("📄 User cancelled file picking");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      setLoading(false);
    }
  };

  const analyzeResume = async (id: string) => {
    setLoading(true);
    setLoadingStage('parsing');
    try {
      // Step 1: Analyze layout
      console.log(`🔍 Analyzing layout with upload_id: ${id}`);
      const layoutResp = await fetch(`${API_BASE_URL}/resumes/${id}/layout`);
      
      if (layoutResp.status !== 200) {
        console.error(`❌ Layout analysis failed with status: ${layoutResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Layout analysis failed. Server returned status ${layoutResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const layoutData = await layoutResp.json();
      console.log('✅ Successfully analyzed layout:', layoutData);
      
      // Step 2: Parse resume
      console.log(`🔍 Parsing resume with upload_id: ${id}`);
      setLoadingStage('parsing');
      const parseResp = await fetch(`${API_BASE_URL}/resumes/${id}/parse`);
      
      if (parseResp.status !== 200) {
        console.error(`❌ Parse request failed with status: ${parseResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume parsing failed. Server returned status ${parseResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const parseData = await parseResp.json();
      console.log('✅ Successfully parsed resume:', parseData);
      
      // Step 3: Evaluate resume quality
      console.log(`🔄 Evaluating resume quality with id: ${id}`);
      setLoadingStage('analysing');
      const evalResp = await fetch(`${API_BASE_URL}/resumes/${id}/evaluate`);
      
      if (evalResp.status !== 200) {
        console.error(`❌ Evaluation request failed with status: ${evalResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume evaluation failed. Server returned status ${evalResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const evalData = await evalResp.json();
      console.log('✅ Successfully evaluated resume:', evalData);
      
      // Process evaluation data
      const responseData = evalData.response;
      
      // Update category scores directly from API response
      if (responseData.scores) {
        setCategoryScores({
          format_layout: responseData.scores.format_layout || 0,
          inhalt_struktur: responseData.scores.inhalt_struktur || 0,
          sprache_stil: responseData.scores.sprache_stil || 0,
          ergebnis_orientierung: responseData.scores.ergebnis_orientierung || 0,
          overall: responseData.scores.overall || 0
        });
      } else {
        console.warn('⚠️ No scores found in evaluation response');
        setCategoryScores(null);
      }
      
      // Update feedback messages directly from API response
      const messages = [];
      if (responseData.feedback) {
        Object.entries(responseData.feedback).forEach(([category, items]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              messages.push({
                section: formatCategoryName(category),
                text: item
              });
            });
          }
        });
        setFeedbackMessages(messages);
      } else {
        console.log('No feedback found in evaluation response');
        setFeedbackMessages([{ 
          section: 'Info', 
          text: 'No feedback available for this resume.' 
        }]);
      }
      
    } catch (e: any) {
      console.error("Analysis error:", e);
      setFeedbackMessages([{ 
        section: 'Error', 
        text: `An unexpected error occurred during resume analysis: ${e?.message || 'Unknown error'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format category names for display
  const formatCategoryName = (category) => {
    const mapping = {
      'format_layout': 'Format & Layout',
      'inhalt_struktur': 'Content & Structure',
      'sprache_stil': 'Language & Style',
      'ergebnis_orientierung': 'Results Orientation'
    };
    return mapping[category] || category;
  };
  const selectJob = (job: typeof DUMMY_JOBS[0]) => {
    setSelectedJob(job);
    setJobDescription(job.description);
  };

  const matchWithJob = async () => {
    if (!uploadId || !jobDescription.trim()) {
      setFeedbackMessages([{ 
        section: 'Error', 
        text: 'Please upload a resume and enter a job description first.' 
      }]);
      return;
    }
    
    setLoading(true);
    try {
      // Prepare job data in the format expected by the API
      const jobData = {
        job_descriptions: [
          {
            job_id: selectedJob?.id || 'job1',
            job_title: selectedJob?.title || 'Job Position',
            description: jobDescription
          }
        ]
      };
      
      console.log(`🔍 Matching resume with job description, upload_id: ${uploadId}`);
      const matchResp = await fetch(`${API_BASE_URL}/resumes/${uploadId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (matchResp.status !== 200) {
        console.error(`❌ Match request failed with status: ${matchResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume matching failed. Server returned status ${matchResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const matchData = await matchResp.json();
      console.log('✅ Successfully matched resume with job:', matchData);
      
      // Process match data directly from API response
      const responseData = matchData.response;
      if (responseData && responseData.length > 0) {
        const jobMatch = responseData[0];
        
        // Use only data directly from the API response
        setMatchResult({
          match_score: jobMatch.overall_score || 0,
          missing_keywords: jobMatch.missing_skills || [],
          suggestions: jobMatch.matching_skills || [],
          improvement_suggestions: jobMatch.improvement_suggestions || []
        });
      } else {
        console.warn('⚠️ No match results found in response');
        setFeedbackMessages(prev => [...prev, { 
          section: 'Match Results', 
          text: 'No match results available. The job description may be too short or not specific enough.' 
        }]);
        setMatchResult(null);
      }
      
    } catch (e: any) {
      console.error("Match error:", e);
      setFeedbackMessages([{ 
        section: 'Error', 
        text: `An unexpected error occurred during job matching: ${e?.message || 'Unknown error'}` 
      }]);
      setMatchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 33) return COLORS.rose; // Rose
    else if (score < 66) return COLORS.sky; // Sky
    else return COLORS.nightSky; // Night Sky
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

      
        {uploadStarted && !loading && feedbackMessages.length > 0 && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'analyse' && styles.activeTabButton]}
            onPress={() => setActiveTab('analyse')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'analyse' && styles.activeTabText]}>Analyse</Text>
            {activeTab === 'analyse' && <LinearGradient 
              colors={[COLORS.rose, COLORS.sky]} 
              style={styles.activeTabIndicator} 
            />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'match' && styles.activeTabButton]}
            onPress={() => setActiveTab('match')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'match' && styles.activeTabText]}>Match</Text>
            {activeTab === 'match' && <LinearGradient 
              colors={[COLORS.rose, COLORS.sky]} 
              style={styles.activeTabIndicator} 
            />}
          </TouchableOpacity>
        </View>
      )}

      {!uploadStarted && !loading ? (
        <View style={styles.setupContainer}>
          <Text style={styles.uploadMessage}>Please upload your CV to personalize your experience and improve your CV</Text>
          <TouchableOpacity style={styles.uploadButtonContainer} onPress={pickAndUpload} disabled={loading}>
            <LinearGradient
              colors={[COLORS.rose, COLORS.sky]}
              style={styles.uploadButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Upload CV</Text>
                  <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {loadingStage === 'parsing' ? `Parsing CV${loadingDots}` : `Analysing CV${loadingDots}`}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
          </View>
        </View>
      ) : feedbackMessages.length > 0 ? (
        <ScrollView style={styles.chatContainer}>
          {/* Loading indicator moved to its own conditional rendering block */}
          
          {/* Display category scores if available */}
          {activeTab === 'analyse' && categoryScores && (
            <View>
              {currentFileName && (
                <TouchableOpacity 
                  style={styles.fileNameContainer}
                  onPress={pickAndUpload}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={16} color={COLORS.nightSky} />
                  <Text style={styles.fileName}>{currentFileName}</Text>
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="refresh-outline" size={14} color={COLORS.nightSky} />
                  </View>
                </TouchableOpacity>
              )}
              <Text style={styles.sectionHeader}>Resume Score</Text>
              {/* Circular Progress Chart */}
              <CircularProgress percentage={categoryScores.overall} />
              <Text style={styles.categorySectionHeader}>Category Scores</Text>
              
              {/* Format & Layout Score - Collapsible */}
              <CategoryItem 
                title="Format & Layout" 
                score={categoryScores.format_layout} 
                feedback={feedbackMessages} 
              />
              
              {/* Content & Structure Score - Collapsible */}
              <CategoryItem 
                title="Content & Structure" 
                score={categoryScores.inhalt_struktur} 
                feedback={feedbackMessages} 
              />
              
              {/* Language & Style Score - Collapsible */}
              <CategoryItem 
                title="Language & Style" 
                score={categoryScores.sprache_stil} 
                feedback={feedbackMessages} 
              />
              
              {/* Results Orientation Score - Collapsible */}
              <CategoryItem 
                title="Results Orientation" 
                score={categoryScores.ergebnis_orientierung} 
                feedback={feedbackMessages} 
              />
            </View>
          )}
          
          {/* Detailed Feedback wurde entfernt, da es bereits in den Kategorie-Karten enthalten ist */}

          {activeTab === 'match' && (
            <>
              <Text style={styles.sectionHeader}>Suggested Jobs</Text>
              <View style={styles.jobsContainer}>
                {DUMMY_JOBS.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onSelect={() => selectJob(job)}
                    isSelected={selectedJob?.id === job.id}
                  />
                ))}
              </View>
              
              <Text style={styles.sectionHeader}>Job Match</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste job description or select a job above..."
                multiline
                value={jobDescription}
                onChangeText={setJobDescription}
              />
              <TouchableOpacity style={styles.button} onPress={matchWithJob} disabled={loading}>
                <Text style={styles.buttonText}>Match Resume to Job</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'match' && matchResult && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Match Score: {matchResult.match_score.toFixed(1)}%</Text>
              
              {matchResult.missing_keywords && matchResult.missing_keywords.length > 0 ? (
                <>
                  <Text style={styles.cardSubtitle}>Missing Keywords:</Text>
                  <Text style={styles.cardDescription}>Add these skills to your resume to improve your match:</Text>
                  {matchResult.missing_keywords.map((kw, i) => (
                    <Text key={i} style={styles.cardText}>• {kw}</Text>
                  ))}
                </>
              ) : (
                <Text style={styles.cardDescription}>No missing keywords detected.</Text>
              )}
              
              {matchResult.suggestions && matchResult.suggestions.length > 0 ? (
                <>
                  <Text style={styles.cardSubtitle}>Matching Skills:</Text>
                  <Text style={styles.cardDescription}>These skills from your resume match the job requirements:</Text>
                  {matchResult.suggestions.map((s, i) => (
                    <Text key={i} style={styles.cardText}>• {s}</Text>
                  ))}
                </>
              ) : (
                <Text style={styles.cardDescription}>No matching skills detected. Try adding relevant skills to your resume.</Text>
              )}
              
              {matchResult.improvement_suggestions && matchResult.improvement_suggestions.length > 0 ? (
                <>
                  <Text style={styles.cardSubtitle}>Improvement Tips:</Text>
                  <Text style={styles.cardDescription}>Follow these suggestions to improve your resume match:</Text>
                  {matchResult.improvement_suggestions.map((tip, i) => (
                    <Text key={i} style={styles.cardText}>• {tip}</Text>
                  ))}
                </>
              ) : (
                <>
                  <Text style={styles.cardSubtitle}>Improvement Tips:</Text>
                  <Text style={styles.cardText}>• Highlight the matching skills more prominently in your resume</Text>
                  <Text style={styles.cardText}>• Add missing keywords to relevant sections</Text>
                  <Text style={styles.cardText}>• Tailor your experience descriptions to include job-specific terminology</Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      ) : uploadStarted ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Waiting for results{loadingDots}</Text>
        </View>
      ) : (
        <View style={styles.setupContainer}>
          <Text style={styles.uploadMessage}>Please select a file to upload</Text>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.salt }, // Salt
  container: { flex: 1, paddingVertical: 5, paddingHorizontal: 20, backgroundColor: COLORS.salt }, // Salt
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 0, marginBottom: 5, color: COLORS.nightSky }, // Sky
  
  // Job Card Styles
  jobsContainer: {
    marginBottom: 15,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: COLORS.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.salt,
  },
  selectedJobCard: {
    borderColor: COLORS.nightSky,
    borderWidth: 2,
    backgroundColor: COLORS.salt,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: COLORS.lightRose,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobLogo: {
    width: 50,
    height: 50,
    resizeMode: 'cover',
  },
  jobInfoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.nightSky,
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: COLORS.sky,
    marginBottom: 4,
  },
  jobLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLocation: {
    fontSize: 12,
    color: COLORS.nightSky,
    marginLeft: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  
  // Circular progress styles
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  
  // Category item styles
  categoryItemContainer: {
    marginVertical: 6,
    backgroundColor: COLORS.lightRose, // Light Rose für Category Cards
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.midnight, // Midnight
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    borderWidth: 1,
    borderColor: COLORS.rose,
  },
  categoryHeaderItem: {
    padding: 15,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.nightSky, // Night Sky auf weißem Hintergrund
  },
  categoryScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.nightSky, // Night Sky auf weißem Hintergrund
  },
  scoreBarOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBarContainerNew: {
    flex: 1,
    height: 12, // Etwas höher für bessere Sichtbarkeit
    backgroundColor: COLORS.salt, // Salt für besseren Kontrast zum Füllbalken
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightRose,
  },
  feedbackContainer: {
    padding: 15,
    backgroundColor: COLORS.salt, // Salt
    borderTopWidth: 1,
    borderTopColor: COLORS.lightRose, // Light Rose
  },
  feedbackItem: {
    marginVertical: 5,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.midnight, // Midnight
    lineHeight: 20,
    fontWeight: '500', // Etwas fetter für bessere Lesbarkeit
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightRose, // Light Rose
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 16,
    color: COLORS.sky, // Sky
  },
  activeTabText: {
    color: COLORS.nightSky, // Night Sky
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadMessage: { fontSize: 18, textAlign: 'center', marginBottom: 40, color: COLORS.nightSky, maxWidth: '80%', lineHeight: 24 }, // Night Sky
  input: { borderWidth: 1, borderColor: COLORS.lightRose, borderRadius: 5, padding: 10, marginVertical: 10 }, // Light Rose
  button: { backgroundColor: COLORS.sky, padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 10 }, // Sky
  uploadButtonContainer: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: COLORS.salt, // Salt
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: Dimensions.get('window').height * 0.7 },
  loadingText: { fontSize: 22, marginBottom: 20, color: COLORS.nightSky, fontWeight: '500' }, // Night Sky
  progressBarContainer: { width: '80%', height: 10, backgroundColor: COLORS.lightRose, borderRadius: 5 }, // Light Rose
  progressBar: { height: 10, backgroundColor: COLORS.nightSky, borderRadius: 5 }, // Night Sky für Ladebalken
  scoreBarFill: {
    height: '100%',
    backgroundColor: COLORS.nightSky, // Night Sky für besseren Kontrast
    borderRadius: 5,
  }, // Night Sky
  chatContainer: { flex: 1 },
  messageBubble: { backgroundColor: COLORS.salt, padding: 10, borderRadius: 5, marginVertical: 5 }, // Salt
  messageText: { fontSize: 16, color: COLORS.midnight }, // Midnight
  sectionHeader: { fontSize: 20, fontWeight: '700', marginTop: 10, marginBottom: 5, color: COLORS.nightSky }, // Night Sky, kompaktere Margins
  card: { backgroundColor: COLORS.lightRose, padding: 12, borderRadius: 10, marginVertical: 8, elevation: 2, shadowColor: COLORS.midnight, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.5 }, // Light Rose für Karten
  cardTitle: { fontSize: 18, fontWeight: '500' },
  cardSubtitle: { fontSize: 16, fontWeight: '600', marginTop: 16, color: COLORS.nightSky },
  cardDescription: { fontSize: 14, marginTop: 4, marginBottom: 8, color: COLORS.sky, fontStyle: 'italic' },
  cardText: { fontSize: 14, marginVertical: 2, paddingLeft: 4 },
  // scoreContainer entfernt - Inhalt direkt auf dem Hintergrund
  overallScoreContainer: { flexDirection: 'row', alignItems: 'center' },
  overallScoreText: { fontSize: 24, fontWeight: 'bold' },
  overallScoreLabel: { fontSize: 16, marginLeft: 5 },
  categorySectionHeader: { fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 5, color: COLORS.nightSky },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  categoryLabel: { fontSize: 16, flex: 1 },
  scoreBarItemContainer: { height: 10, width: '60%', backgroundColor: '#ddd', borderRadius: 5, marginRight: 10 },
  scoreBar: { height: 10, borderRadius: 5 },
  scoreBarLow: { backgroundColor: COLORS.rose },
  scoreBarMedium: { backgroundColor: COLORS.sky },
  scoreBarHigh: { backgroundColor: COLORS.nightSky },
  scoreValue: { fontSize: 16 },
  fileNameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, backgroundColor: COLORS.salt, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.lightRose, justifyContent: 'space-between' },
  fileName: { fontSize: 14, fontWeight: '500', color: COLORS.nightSky, marginLeft: 5, flex: 1 },
  uploadIconContainer: { backgroundColor: COLORS.lightRose, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});