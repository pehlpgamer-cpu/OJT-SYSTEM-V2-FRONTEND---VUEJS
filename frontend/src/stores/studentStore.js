import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Student Store (Pinia)
 * 
 * Manages student profile and skills state:
 * - Student profile (name, bio, location, availability, GPA, academic program)
 * - Skills list with proficiency levels
 * - Job applications submitted
 * - Profile completeness calculation
 * 
 * ARCHITECTURE:
 * - profile: Single profile object
 * - skills: Array of student skills
 * - applications: Array of submitted applications
 * - Computed properties for UI derivations
 * 
 * PROFILE COMPLETENESS:
 * Calculates what % of profile is filled out
 * Score breakdown:
 * - Basic info: 20 points (name)
 * - Bio/description: 20 points
 * - Location/availability: 25 points
 * - Education: 20 points  
 * - Skills: 15 points
 * 
 * Total: 100 points = complete profile
 * Used for UX hints: low score suggests profile updates
 */
export const useStudentStore = defineStore('student', () => {
  /**
   * @type {Ref<Object|null>}
   * Student profile with id, name, bio, GPA, school, etc.
   * Populated from /student/profile API
   */
  const profile = ref(null)
  
  /**
   * @type {Ref<Array>}
   * Array of student skills with proficiency levels
   * Example: [{ id: 1, name: \"JavaScript\", proficiency: \"expert\" }]
   */
  const skills = ref([])
  
  /**
   * @type {Ref<Array>}
   * Applications student has submitted to postings
   * Example: [{ id: 1, posting_id: 5, status: \"pending\" }]
   */
  const applications = ref([])

  /**
   * Calculate profile completeness percentage (0-100)
   * 
   * WHAT: Determines how complete/filled out profile is
   * HOW: Checks which fields are populated and adds points
   * WHY: Prompts user to complete profile for better matches
   * 
   * ERROR HANDLING:
   * - Returns 0 if profile not loaded
   * - Caps at 100 max
   * - Continues even if some fields missing
   * 
   * @type {ComputedRef<number>}
   * @returns {number} 0-100 score
   */
  const profileCompleteness = computed(() => {
    if (!profile.value) {
      console.debug('[StudentStore] Profile not loaded, completeness = 0')
      return 0
    }
    
    let score = 0
    
    // BASIC INFO (20 points)
    if (profile.value.first_name) score += 10
    if (profile.value.last_name) score += 10
    
    // BIO/DESCRIPTION (20 points)
    if (profile.value.bio) score += 20
    
    // LOCATION & AVAILABILITY (25 points)
    if (profile.value.preferred_location) score += 10
    if (profile.value.availability_start && profile.value.availability_end) score += 15
    
    // EDUCATION (20 points)
    if (profile.value.gpa) score += 10
    if (profile.value.academic_program) score += 10
    
    // SKILLS (15 points)
    if (skills.value.length > 0) score += 15

    const capped = Math.min(score, 100)
    console.debug('[StudentStore] Profile completeness calculated', { score, capped })
    return capped
  })

  /**
   * Is profile fully complete? (100%)
   * 
   * @type {ComputedRef<boolean>}
   * @returns {boolean} true if completeness >= 100
   */
  const isProfileComplete = computed(() => {
    const complete = profileCompleteness.value >= 100
    console.debug('[StudentStore] Profile completeness check', { isComplete: complete })
    return complete
  })

  /**
   * Update entire profile
   * @param {Object} newProfile - Profile object from API
   */
  const setProfile = (newProfile) => { 
    console.debug('[StudentStore] setProfile called', { hasProfile: !!newProfile })
    profile.value = newProfile 
  }
  
  /**
   * Replace entire skills array
   * @param {Array} newSkills - Array of skill objects
   */
  const setSkills = (newSkills) => { 
    console.debug('[StudentStore] setSkills called', { count: newSkills?.length })
    skills.value = newSkills 
  }
  
  /**
   * Add single skill to array
   * @param {Object} skill - Skill object to add
   */
  const addSkill = (skill) => { 
    console.debug('[StudentStore] addSkill called', { skillName: skill?.name })
    skills.value.push(skill) 
  }
  
  /**
   * Update existing skill (finds by ID and replaces)
   * FIX: Should validate ID exists before updating
   * @param {Object} updatedSkill - Skill with updated values
   */
  const updateSkill = (updatedSkill) => {
    console.debug('[StudentStore] updateSkill called', { skillId: updatedSkill?.id })
    const index = skills.value.findIndex(s => s.id === updatedSkill.id)
    if (index !== -1) {
      skills.value[index] = updatedSkill
      console.debug('[StudentStore] Skill updated successfully', { skillId: updatedSkill.id })
    } else {
      console.warn('[StudentStore] Skill not found in array', { skillId: updatedSkill.id })
    }
  }
  
  /**
   * Remove skill from array
   * @param {string|number} skillId - ID of skill to remove
   */
  const removeSkill = (skillId) => {
    console.debug('[StudentStore] removeSkill called', { skillId })
    const before = skills.value.length
    skills.value = skills.value.filter(s => s.id !== skillId)
    const after = skills.value.length
    console.debug('[StudentStore] Skill removed', { skillId, removed: before > after })
  }

  /**
   * Set applications array
   * @param {Array} apps - Applications array from API
   */
  const setApplications = (apps) => { 
    console.debug('[StudentStore] setApplications called', { count: apps?.length })
    applications.value = apps 
  }

  // Store exports
  return {
    // Reactive state
    profile,
    skills,
    applications,
    
    // Computed
    profileCompleteness,
    isProfileComplete,
    
    // Mutations
    setProfile,
    setSkills,
    addSkill,
    updateSkill,
    removeSkill,
    setApplications
  }
})
