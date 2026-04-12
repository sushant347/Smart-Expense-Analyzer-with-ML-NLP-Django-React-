from rest_framework import serializers
from .models import Transaction


VALID_CATEGORIES = [
    'Food',
    'Rent',
    'Transport',
    'Shopping',
    'Entertainment',
    'Health',
    'Education',
    'Transfer',
    'Other',
]


class TransactionSerializer(serializers.ModelSerializer):
    category = serializers.ChoiceField(choices=VALID_CATEGORIES, required=False, default='Other')

    class Meta:
        model = Transaction
        fields = [
            'id',
            'user',
            'date',
            'description',
            'amount',
            'transaction_type',
            'category',
            'source',
            'confidence_score',
            'is_manually_corrected',
        ]
        read_only_fields = ['id', 'user', 'confidence_score', 'is_manually_corrected']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate_description(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Description is required.')
        return cleaned

    def create(self, validated_data):
        # Automatically assign user from request context
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data.setdefault('source', 'MANUAL')
        return super().create(validated_data)
