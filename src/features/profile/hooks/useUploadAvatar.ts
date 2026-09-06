import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmAvatarUpload, requestAvatarUploadUrl, uploadAvatarToS3 } from '../api/avatar-api';
import { profileKeys } from '../query-keys';
import { validateAvatarFile } from '../schemas/avatar.schema';
import type { FullProfileApi } from '../schemas/full-profile-api.schema';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: async (file: File) => {
      const validationError = validateAvatarFile(file);
      if (validationError) throw new Error(validationError);

      const upload = await requestAvatarUploadUrl({
        file_name: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      await uploadAvatarToS3(upload.upload_url, file, upload.headers);
      return confirmAvatarUpload(upload.upload_id);
    },
    onSuccess: (confirmedAvatar) => {
      queryClient.setQueryData<FullProfileApi>(queryKey, (profile) =>
        profile ? { ...profile, avatar_url: confirmedAvatar.avatar_url } : profile
      );
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
