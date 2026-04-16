import { ref } from 'vue'
import { apiClient } from '../utils/apiClient'
import { useStudentStore } from '../stores/studentStore'

export function useStudentProfile() {
  const store = useStudentStore()
  const isLoading = ref(false)

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const data = await apiClient('/student/profile', { method: 'GET' })
      store.setProfile(data.profile || data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (profileData) => {
    isLoading.value = true
    try {
      const data = await apiClient('/student/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      })
      store.setProfile(data.profile || data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  const fetchSkills = async () => {
    isLoading.value = true
    try {
      const data = await apiClient('/student/skills', { method: 'GET' })
      store.setSkills(data.skills || data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  const addSkill = async (skillData) => {
    isLoading.value = true
    try {
      const data = await apiClient('/student/skills', {
        method: 'POST',
        body: JSON.stringify(skillData)
      })
      store.addSkill(data.skill || data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  const updateSkill = async (skillId, skillData) => {
    isLoading.value = true
    try {
      const data = await apiClient(`/student/skills/${skillId}`, {
        method: 'PUT',
        body: JSON.stringify(skillData)
      })
      store.updateSkill(data.skill || data) // assuming API returns updated skill
      return data
    } finally {
      isLoading.value = false
    }
  }

  const deleteSkill = async (skillId) => {
    isLoading.value = true
    try {
      await apiClient(`/student/skills/${skillId}`, { method: 'DELETE' })
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
