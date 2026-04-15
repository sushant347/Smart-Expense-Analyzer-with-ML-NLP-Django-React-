from decimal import Decimal, InvalidOperation

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser


def _normalize_category_savings_goals(raw_value):
    if raw_value in (None, ''):
        return {}

    if not isinstance(raw_value, dict):
        raise serializers.ValidationError('category_savings_goals must be an object mapping category to amount.')

    normalized = {}
    for raw_category, raw_goal in raw_value.items():
        category = str(raw_category).strip()
        if not category:
            continue

        try:
            amount = Decimal(str(raw_goal))
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError({category: 'Goal amount must be numeric.'})

        if amount < 0:
            raise serializers.ValidationError({category: 'Goal amount must be greater than or equal to 0.'})

        normalized[category] = float(round(amount, 2))

    return normalized


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = CustomUser
        fields = [
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'monthly_income',
            'savings_goal',
            'currency',
            'category_savings_goals',
        ]

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError('Email already exists.')
        return normalized_email

    def validate_currency(self, value):
        if value != 'NPR':
            raise serializers.ValidationError('Only NPR is supported as preferred currency.')
        return 'NPR'

    def validate_category_savings_goals(self, value):
        return _normalize_category_savings_goals(value)

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['currency'] = 'NPR'
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'monthly_income',
            'savings_goal',
            'currency',
            'category_savings_goals',
        ]
        read_only_fields = ['id', 'username', 'email', 'currency']

    def validate_category_savings_goals(self, value):
        return _normalize_category_savings_goals(value)

    def update(self, instance, validated_data):
        # Currency is fixed for the product at NPR.
        instance.currency = 'NPR'
        return super().update(instance, validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data
