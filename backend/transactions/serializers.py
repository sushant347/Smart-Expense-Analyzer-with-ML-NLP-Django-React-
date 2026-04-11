from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user']

    def create(self, validated_data):
        # Automatically assign user from request context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
