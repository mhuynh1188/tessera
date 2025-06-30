# 🎮 Gamified Workspace Features Guide

## 🚀 How to Access the New Features

### 1. **Access the Gamified Workspace**
- Go to `/workspace` (your existing hexie library page)
- Click the **"Create Workspace"** button (blue button in the top right)
- This takes you to `/workspace/board` - the new gamified workspace

### 2. **Features Available in the Gamified Workspace**

#### **Main Workspace Tab** 🎯
- **Add Hexies**: Click on hexies in the "Add Hexies to Workspace" section to place them on the canvas
- **Drag & Drop**: Move hexies around the workspace by clicking and dragging
- **Annotations**: Click on any placed hexie to add notes, questions, insights, concerns, solutions, or reflections
- **Severity Assessment**: Rate the severity of workplace antipatterns using psychological frameworks

#### **Progress Tab** 🏆
- **Role Progression**: Track your journey from Explorer → Analyst → Facilitator → Architect → Mentor
- **Competency Development**: 6 core skills that improve as you interact with the system
- **Challenges**: Complete role-specific objectives to earn experience points
- **Badges**: Unlock achievements for various accomplishments
- **Experience System**: Gain XP for placing hexies, adding annotations, and completing assessments

#### **Safety Tab** 🛡️
- **Psychological Monitoring**: Real-time tracking of comfort, engagement, and safety levels
- **Stress Detection**: Automatic detection of concerning patterns
- **Support Resources**: 
  - Breathing exercises (4-7-8 technique)
  - Grounding techniques (5-4-3-2-1 method)
  - Mindful breaks and perspective shifts
- **Crisis Support**: Professional referral pathways (premium feature)

#### **Combinations Tab** 🔗
- **AI-Powered Suggestions**: System detects potential hexie combinations based on proximity and compatibility
- **Novel Interventions**: Create new therapeutic approaches by combining multiple hexies
- **Effectiveness Tracking**: Rate and validate combination effectiveness
- **Community Sharing**: Share successful combinations with others (basic/premium)

## 🎯 **How to Use Each Feature**

### **Annotation System**
1. **Place hexies** in the workspace from the top section
2. **Click on any hexie** to select it
3. **Use the annotation panel** on the right to add insights
4. **Choose annotation type**: note, question, insight, concern, solution, or reflection
5. **Set privacy level**: private, team, or public
6. **Enable anonymous mode** if desired

### **Severity Assessment**
1. **Select the "Severity Assessment" section** in the workspace tab
2. **Rate frequency**: How often does this antipattern occur?
3. **Rate impact**: What's the severity of the impact?
4. **Advanced users** can access contextual factors (team size, duration, etc.)
5. **View recommendations** based on psychological frameworks

### **Role-Based Gameplay**
1. **Check your current role** in the Progress tab
2. **Review available challenges** specific to your role level
3. **Complete objectives** by using workspace features
4. **Earn experience points** and watch your competencies grow
5. **Unlock new badges** and advance to higher roles

### **Psychological Safety**
1. **Monitor your indicators** in the Safety tab
2. **Use the quick check-in** to update your comfort levels
3. **Access support resources** when stress indicators appear
4. **Practice mindfulness techniques** integrated into the system

### **Combination System**
1. **Select 2+ hexies** in the workspace
2. **Review AI suggestions** for potential combinations
3. **Create named combinations** with descriptions
4. **Apply psychological frameworks** to your interventions
5. **Track effectiveness** and get community feedback

## 💰 **Subscription-Based Features**

### **Free Tier** (15 hexies, 3 annotations)
- Basic workspace functionality
- Individual mode only
- Standard safety monitoring
- Basic therapeutic frameworks

### **Basic Tier** (50 hexies, 10 annotations)
- Collaborative features
- Enhanced safety monitoring
- Advanced therapeutic frameworks
- Combination sharing

### **Premium Tier** (200 hexies, 50 annotations)
- Clinical-level safety monitoring
- Professional referral pathways
- Advanced AI combination suggestions
- Export and advanced sharing

## 🧠 **Psychological Design Philosophy**

The system follows **Jordan Peterson's competence hierarchy** principles:

- **Safety-First**: Graduated exposure to complexity based on user readiness
- **Strengths-Based**: Focus on developing existing capabilities rather than fixing deficits
- **Meaningful Progression**: Real-world skill development tied to gamification
- **Collaborative**: Non-competitive mechanics that encourage mutual support
- **Anonymous Options**: Privacy protection for sensitive workplace discussions

## 📊 **Database Integration**

The system uses these new tables (already created via the SQL script):
- `antipattern_types` - Severity and psychological framework data
- `workspace_boards` - Session management and game settings
- `hexie_annotations` - Text annotations with privacy controls
- `user_competencies` - Role progression and skill tracking
- `game_sessions` - Progress and safety monitoring
- `hexie_combinations` - Novel intervention creation
- `safety_monitoring` - Real-time psychological safety alerts
- `support_resources` - Therapeutic intervention resources

## 🔧 **Getting Started**

1. **Run the database migration** (already done if you used the fixed SQL file)
2. **Navigate to** `/workspace` in your app
3. **Click "Create Workspace"** to enter the gamified environment
4. **Start by adding 2-3 hexies** to the workspace
5. **Try annotating one** to see the system in action
6. **Check the Progress tab** to see your role and challenges
7. **Explore the Safety tab** to understand psychological monitoring
8. **Experiment with combinations** to create novel interventions

The system is designed to feel **safe, engaging, and genuinely helpful** for exploring workplace challenges and developing intervention strategies.