import { ref } from 'vue'
import { apiClient } from '../utils/apiClient'
import { useStudentStore } from '../stores/studentStore'

export function useStudentProfile() {
  const store = useStudentStore()
  const isLoading = ref(false)

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const data = await apiClient('/students/profile', { method: 'GET' })
      store.setProfile(data.profile || data.data || data)
      return data
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
      store.setProfile(data.profile || data.data || data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  const fetchSkills = async () => {
    isLoading.value = true
    try {
      const data = await apiClient('/students/skills', { method: 'GET' })
      store.setSkills(data.skills || data.data || data)
      return data
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
      store.addSkill(data.skill || data.data || data)
      return data
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
      store.updateSkill(data.skill || data.data || data) // assuming API returns updated skill
      return data
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
