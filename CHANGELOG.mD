## V1.0.0
    add useage
## V1.0.1 
    change readme 
## V1.0.2 
    change the git repository.
## V1.0.3 
    change readme 
## V1.0.4 
    fix bug Session.Destory lack await
## V1.0.5 
    fix bug delete ctx.SessKey error 
## V1.0.6 
    change readme 
## V1.0.7 
    redesign apis, export with all sequelize apis, you can use this without install sequelize
## V1.0.8
    modify readme
## V1.0.9
    modify readme
## V2.0.0
    redesign all apis;
## v2.0.1
    add the gc_prob_denominator、gc_prob_molecular in the initOptions replace the gc_probability, your can set the probability of session GC by your self with the denominator and molecular. like gc_prob_denominato = 100 and the gc_prob_molecular =1 , means that the gc_probability = 1/100. Default is 1/100. 
## v2.1.2
    1. add api logger, in the initOptions you can set logger by true/false/function, default is true. Set false means not show GC infomation, Set function you can control the log by your own way like white into a file.
    2. modify the set cookie logic, if in the middleware you do not set the expiry or the ExpiryTo, system will auto set cookie whithout expiries, that means when you close the windows, the cookies destroy   
## v3.0.0
    change the apis to CamelCase;
## v3.0.1
    1. class, namesapce, interface or type defined, function use lowerCamelCase;
    2. variable, attribute, property use UpperCamelCase, if protected start with _, if private start with __;
    3. constant use capital letter and underline 
## v3.0.2
    change the name of InitOptions to SessionInitOptions;
## v3.1.2
    1. re-organization  the api for easier use;
    2. add the generic type for the session data;
    3. set the proxy of the sessionData, for changes; 
## v3.1.4 
    add undefined into the DataTypes
## v3.1.5
    change the error in reademe
## v3.1.6
    change the ctx.session.data api to the ctx.session.datas
