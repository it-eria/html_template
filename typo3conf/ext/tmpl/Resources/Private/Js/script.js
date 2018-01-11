//= libs/jquery-3.2.1.js
//= libs/bootstrap.js
//= libs/slick.js
//= libs/jquery.matchHeight-min.js
//= libs/imagesloaded.pkgd.min.js
//= libs/jquery-imagefill.js
//= libs/jquery.nice-select.js
//= libs/bootstrap-tagsinput.min.js

// ---------------------------------------------
// 
// When page loaded
// 
// ---------------------------------------------
$(function() {
    // Burger button event
    $('.burger-btn').on('click', function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        $('.b-main-nav').toggleClass('active');
    });

    // Help buttom
    $('.help-btn').on('click', function(e) {
        e.preventDefault();
        $(this).parent().toggleClass('active');
    });

    // Cover effect for images
    $('html, body').imagesLoaded(function() {
        $('.teaser__thumbnail').imagefill();
    });

    // Resize window event
    $(window).on('resize', function() {
        if($(this).width() > 768) {
            $('.b-main-nav').removeClass('active');
        }
    });

    // Select element
    $('select').niceSelect();
    
    // Tags Input element
    $('.tags-input').tagsinput('items');

    // Sliders
    $('.main-slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        dots: false,
        autoplay: true,
        autoplarSpeed: 6000,
        asNavFor: '.main-slider-nav',
        nextArrow: $('.main-slider-nav-wraper .slider-arrow_next'),
        prevArrow: $('.main-slider-nav-wraper .slider-arrow_prev')
    });
    $('.main-slider-nav').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: true,
        dots: false,
        arrows: false,
        autoplay: true,
        autoplarSpeed: 6000,
        asNavFor: '.main-slider',
        focusOnSelect: true,
        responsive: [
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 1,
                    dots: true,
                    appendDots: $('.main-slider-nav-wraper .dots-ctrl')
                }
            }
        ]
    });

    $('.news-slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplarSpeed: 6000,
        dots:true,
        nextArrow: $('.news-slider-nav-wraper .slider-arrow_next'),
        prevArrow: $('.news-slider-nav-wraper .slider-arrow_prev'),
        appendDots: $('.news-slider-nav-wraper .dots-ctrl')
    });

    $('.image-carousel').slick({
        slidesToShow: 2,
        slidesToScroll: 1,
        autoplay: true,
        autoplarSpeed: 6000,
        nextArrow: $('.image-carousel-wraper .slider-arrow_next'),
        prevArrow: $('.image-carousel-wraper .slider-arrow_prev'),
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1
                }
            }
        ]
    });
});