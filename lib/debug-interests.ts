/**
 * Debug utility to analyze blog tags and interest tracking
 */

import { getAllBlogs } from './contentstack';

/**
 * Analyze all blog tags to see what's available for personalization
 */
export async function debugBlogTags() {
  console.log('🔍 ANALYZING BLOG TAGS FOR PERSONALIZATION');
  console.log('=' .repeat(50));
  
  try {
    const blogs = await getAllBlogs();
    
    if (!blogs || blogs.length === 0) {
      console.log('❌ No blogs found');
      return;
    }
    
    console.log(`📊 Total blogs: ${blogs.length}`);
    
    // Collect all unique tags
    const allTags = new Set<string>();
    const tagFrequency: { [tag: string]: number } = {};
    
    blogs.forEach((blog, index) => {
      console.log(`\n📖 Blog ${index + 1}: "${blog.title}"`);
      
      if (blog.categories_tags && blog.categories_tags.length > 0) {
        console.log(`   🏷️  Tags: ${blog.categories_tags.join(', ')}`);
        
        blog.categories_tags.forEach(tag => {
          const cleanTag = tag.toLowerCase();
          allTags.add(cleanTag);
          tagFrequency[cleanTag] = (tagFrequency[cleanTag] || 0) + 1;
        });
      } else {
        console.log('   ❌ No tags found');
      }
    });
    
    console.log('\n🏷️  ALL UNIQUE TAGS ANALYSIS:');
    console.log('=' .repeat(30));
    
    if (allTags.size === 0) {
      console.log('❌ NO TAGS FOUND IN ANY BLOG POSTS!');
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. Add tags to your blog posts in Contentstack');
      console.log('2. Use specific technical tags like: javascript, react, typescript, frontend, backend');
      console.log('3. Current personalization can only work with existing tags');
      return;
    }
    
    // Sort tags by frequency
    const sortedTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a);
    
    console.log('📈 Tags by frequency:');
    sortedTags.forEach(([tag, count], index) => {
      const percentage = ((count / blogs.length) * 100).toFixed(1);
      console.log(`${index + 1}. ${tag} (${count} posts, ${percentage}%)`);
    });
    
    console.log('\n🎯 PERSONALIZATION ANALYSIS:');
    console.log('=' .repeat(30));
    
    // Analyze tag types
    const techTags = sortedTags.filter(([tag]) => 
      ['javascript', 'react', 'typescript', 'node', 'frontend', 'backend', 'api', 'database', 'html', 'css'].includes(tag)
    );
    
    const generalTags = sortedTags.filter(([tag]) => 
      ['technology', 'tutorial', 'learning', 'case study', 'guide', 'tips'].includes(tag)
    );
    
    console.log('✅ Technical tags found:', techTags.map(([tag]) => tag).join(', ') || 'NONE');
    console.log('📝 General tags found:', generalTags.map(([tag]) => tag).join(', ') || 'NONE');
    
    if (techTags.length === 0) {
      console.log('\n⚠️  WARNING: No specific technical tags found!');
      console.log('This explains why you see general interests like "Technology" instead of "JavaScript"');
    }
    
    console.log('\n💡 SUGGESTIONS FOR BETTER PERSONALIZATION:');
    console.log('=' .repeat(40));
    
    if (techTags.length < 5) {
      console.log('1. 🏷️  Add more specific technical tags to your blog posts:');
      console.log('   - JavaScript, React, TypeScript, Node.js');
      console.log('   - Frontend, Backend, Full-stack');
      console.log('   - Database, API, DevOps');
      console.log('   - HTML, CSS, Vue, Angular');
      console.log('   - Python, Java, C#, Go');
    }
    
    if (generalTags.length > techTags.length) {
      console.log('2. 🎯 Balance general vs. specific tags');
      console.log('   - Keep some general tags like "Tutorial", "Guide"');
      console.log('   - But add specific technical tags for better personalization');
    }
    
    console.log('3. 📊 Recommended tag structure for each blog post:');
    console.log('   - 1-2 technical tags (JavaScript, React)');
    console.log('   - 1 level tag (Beginner, Intermediate, Advanced)');
    console.log('   - 1 category tag (Tutorial, Case Study, Tips)');
    
    console.log('\n🚀 EXPECTED IMPROVEMENT:');
    console.log('After adding specific tags, users will see interests like:');
    console.log('• #1 JavaScript   • #2 React   • #3 Frontend');
    console.log('Instead of:');
    console.log('• #1 Technology   • #2 Case Studies   • #3 Tutorials');
    
  } catch (error) {
    console.error('❌ Error analyzing blog tags:', error);
  }
}

/**
 * Suggest ideal tags for personalization
 */
export function suggestPersonalizationTags() {
  console.log('\n🎯 IDEAL TAGS FOR PERSONALIZATION:');
  console.log('=' .repeat(35));
  
  const categories = {
    'Frontend Technologies': [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 
      'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap'
    ],
    'Backend Technologies': [
      'Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust',
      'Express', 'Django', 'Spring', 'ASP.NET'
    ],
    'Database & Storage': [
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
      'Database', 'SQL', 'NoSQL'
    ],
    'DevOps & Tools': [
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'CI/CD', 'DevOps', 'Git', 'Testing'
    ],
    'Development Types': [
      'Frontend', 'Backend', 'Full-stack', 'Mobile',
      'Web Development', 'API Development'
    ],
    'Content Types': [
      'Tutorial', 'Case Study', 'Guide', 'Tips',
      'Best Practices', 'News', 'Review'
    ],
    'Skill Levels': [
      'Beginner', 'Intermediate', 'Advanced',
      'Getting Started', 'Deep Dive'
    ]
  };
  
  Object.entries(categories).forEach(([category, tags]) => {
    console.log(`\n📂 ${category}:`);
    tags.forEach(tag => console.log(`   • ${tag}`));
  });
}
