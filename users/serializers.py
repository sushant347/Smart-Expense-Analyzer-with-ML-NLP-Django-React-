from rest_framework import serializers
from .models import CustomUser

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'monthly_income', 'savings_goal', 'currency']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            monthly_income=validated_data.get('monthly_income'),
            savings_goal=validated_data.get('savings_goal'),
            currency=validated_data.get('currency', 'NPR'),
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'monthly_income', 'savings_goal', 'currency']
        read_only_fields = ['id', 'username']
