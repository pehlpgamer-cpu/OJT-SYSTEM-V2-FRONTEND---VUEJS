import { ref } from 'vue'
import { apiClient } from '../utils/apiClient'
import { useStudentStore } from '../stores/studentStore'

export const normalizeStudentProfileResponse = (payload) => {
  if (!payload) return null
  return payload.profile || payload.student || payload.data?.profile || payload.data?.student || payload.data || payload
}

export const normalizeSkillsResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.skills || payload?.data?.skills || payload?.data || []
}

export const normalizeSkillResponse = (payload) => {
  if (!payload) return null
  return payload.skill || payload.data?.skill || payload.data || payload
}

export function useStudentProfile() {
  const store = useStudentStore()
  const isLoading = ref(false)

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const data = await apiClient('/students/profile', { method: 'GET' })
      const profile = normalizeStudentProfileResponse(data)
      store.setProfile(profile)
      return profile
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (profileData) => {
    isLoading.value = true
    try {
      const data = await apiClient('/students/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      })
      const profile = normalizeStudentProfileResponse(data)
      store.setProfile(profile)
      return profile
    } finally {
      isLoading.value = false
    }
  }

  const fetchSkills = async () => {
    isLoading.value = true
    try {
      const data = await apiClient('/students/skills', { method: 'GET' })
      const skills = normalizeSkillsResponse(data)
      store.setSkills(skills)
      return skills
    } finally {
      isLoading.value = false
    }
  }

  const addSkill = async (skillData) => {
    isLoading.value = true
    try {
      const data = await apiClient('/students/skills', {
        method: 'POST',
        body: JSON.stringify(skillData)
      })
      const skill = normalizeSkillResponse(data)
      store.addSkill(skill)
      return skill
    } finally {
      isLoading.value = false
    }
  }

  const updateSkill = async (skillId, skillData) => {
    isLoading.value = true
    try {
      const data = await apiClient(`/students/skills/${skillId}`, {
        method: 'PUT',
        body: JSON.stringify(skillData)
      })
      const skill = normalizeSkillResponse(data)
      store.updateSkill(skill)
      return skill
    } finally {
      isLoading.value = false
    }
  }

  const deleteSkill = async (skillId) => {
    isLoading.value = true
    try {
      await apiClient(`/students/skills/${skillId}`, { method: 'DELETE' })
      store.removeSkill(skillId)
    } finally {
      isLoading.value = false
    }
  }

  return {
    fetchProfile,
    updateProfile,
    fetchSkills,
    addSkill,
    updateSkill,
    deleteSkill,
    isLoading
  }
}
