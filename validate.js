function Validator(formSelector,options){
    var _this = this
    var formRules = {};

    function getParent(element,selector){
        while(element.parentElement){
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }else{
                element = element.parentElement
            }
        }
    }

    /**
     * Quy ước tạo rules
     * - Nếu có lỗi thỉ return error message
     * - Nếu ko có lỗi thì return undefined
     */
    var validatorRules = {
        required: function(value){
            return value ? undefined: 'Vui lòng nhập trường này'
        },
        email: function(value){
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined: 'Vui lòng nhập email'
        },
        min: function(min){
            return function(value){
                return value.length >= min ? undefined: `Nhập ít nhất ${min} kí tự`
            }
        }
    };

    //Lấy ra form element trong DOM theo 'formSelector'
    var formElement = document.querySelector(formSelector)

    if(formElement){
        var inputs = formElement.querySelectorAll('[name][rules]')
        for(var input of inputs){

            // getAttribute để lấy nội dung của attributes hợp lệ( có sẵn) và cả attributes tự tạo
            // formRules[input.name] = input.getAttribute('rules') 
            var rules = input.getAttribute('rules').split('|')
            for(var rule of rules){
                var ruleInfo;
                
                //tách min:6
                var isRuleHasValue = rule.includes(':')
                if(isRuleHasValue){
                    ruleInfo =  rule.split(':')
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]
                if(isRuleHasValue){
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }
                if( Array.isArray(formRules[input.name])){
                    formRules[input.name].push(ruleFunc);
                }else{
                    formRules[input.name] = [ruleFunc];
                }
                console.log(formRules)
                //Lắng nghe sự kiện để validate(blur, change,...)
                input.onblur = handleValidate;
                input.oninput = handleClearError;
            }
            //Hàm thực hiện validate
            function handleValidate(event){
                var rules = formRules[event.target.name];
                var errorMessage ;

                for(var rule of rules){
                    errorMessage = rule(event.target.value);
                    if(errorMessage) break;
                }

                //Nếu có lỗi thì hiển thị lỗi ra 
                if(errorMessage){
                    var formGroup = getParent(event.target,'.form-group')
                    // if(!formGroup) return;
                    if(formGroup){
                        formGroup.classList.add('invalid')
                        var formMessage =  formGroup.querySelector('.form-message');
                        if(formMessage){
                            formMessage.innerText = errorMessage;
                        }
                    }
                }
                return !errorMessage;
                
            }
        }
        function handleClearError(event){
            var formGroup = getParent(event.target,'.form-group');
            if(formGroup.classList.contains('invalid')){
                formGroup.classList.remove('invalid')
                var formMessage = formGroup.querySelector('.form-message');

                if(formMessage){
                    formMessage.innerText = ''
                }
            }

        }
        // console.log(formRules)
    }
    //Xử lí hành vi submit form
    formElement.onsubmit = function(event){
        event.preventDefault();

        var inputs = formElement.querySelectorAll('[name][rules]')
        var isValid = true;
        for(var input of inputs){
            if(!handleValidate({target:input})){
                isValid = false;
            }
        }

        //Khi không có lồi thì submit form
        if(isValid){
            if(typeof _this.onSubmit === 'function'){
                var enableInputs = formElement.querySelectorAll('[name]');
                var formValues = Array.from(enableInputs).reduce(function(values,input){
                    switch(input.type){
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                            break;
                        case 'checkbox':
                            //Nếu  input chưa checked thì trả về rỗng và dừng code-> sang vòng lặp mới
                            if(!input.matches(':checked')) {
                                if(!values[input.name]){
                                    values[input.name] = '';
                                }
                                return values;
                            }
                            //Nếu các thuộc tính con chưa phải là array thì khai báo lại array
                            if(!Array.isArray(values[input.name])){
                                values[input.name] = []
                            }
                            values[input.name].push(input.value)
                            break;
                        case 'file':
                            values[input.name] = input.files
                            break;
                        default:
                            values[input.name] = input.value;
                            break;
                    }
                    return values;
                },{});
                //Gọi lại hàm onSubmit và trả về giá trị của form
                _this.onSubmit(formValues);
            }else{
                formElement.submit();
            }
        }
    }

}