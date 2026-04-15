from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context:
            status_code = renderer_context['response'].status_code
        else:
            status_code = 200

        # Skip wrapping only when payload is already a full standardized envelope.
        if isinstance(data, dict) and {'status', 'data', 'message'}.issubset(set(data.keys())):
            return super().render(data, accepted_media_type, renderer_context)

        # Build standardized response
        is_success = status_code < 400
        
        response_data = {
            'status': 'success' if is_success else 'error',
            'data': data if is_success else None,
            'message': None
        }

        # If error, try to extract error details into message
        if not is_success:
            if isinstance(data, dict):
                if 'detail' in data:
                    response_data['message'] = data['detail']
                elif 'error' in data:
                    response_data['message'] = data['error']
                elif 'non_field_errors' in data:
                    response_data['message'] = data['non_field_errors']
                else:
                    response_data['message'] = data  # include full validation error dict
            else:
                response_data['message'] = str(data)
                
        # If success, maybe it was a success message payload
        elif isinstance(data, dict) and 'message' in data and len(data) == 1:
             response_data['message'] = data['message']
             response_data['data'] = None

        return super().render(response_data, accepted_media_type, renderer_context)
