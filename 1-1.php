<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>практическая работа</title>
</head>
<body>
    <h3>1-1 задание</h3>
    <?php
        $celoe = 52;            
        $s_tchk = 6.99;        
        $stroka = "мяу мяу"; 
        $logich = true;      
        $massive = [1, 2, 3];    

        echo "тип \$celoe: " . gettype($celoe) . "<br>\n";
        echo "тип \$s_tchk: " . gettype($s_tchk) . "<br>\n";
        echo "тип \$stroka: " . gettype($stroka) . "<br>\n";
        echo "тип \$logich: " . gettype($logich) . "<br>\n";
        echo "тип \$massive: " . gettype($massive) . "<br>\n";
    ?>

    <h3>1-2 задание</h3>
    <?php
        $num1 = 22;
        $num2 = 30;
        $result = $num1 + $num2;
        $result2 = $num1 * $num2;
        
        echo "сумма: $num1 + $num2 = $result<br>\n";
        echo "умножение: ".$num1." * ".$num2." = ". $result2 . "\n"; //другой способ записи
    ?>

    <h3>1-3 задание</h3>
    <?php
        $str1 = "котята говорят ";
        $str2 = "мяу мяу!!";
        $concatenated = $str1 . $str2;
        echo $concatenated;
    ?>

    <h3>1-4 задание</h3>
    <?php
        $a = 10;
        $b = 20;

        echo "исследование тернарного оператора с переменными a = $a и b = $b:<br>\n";

        $result1 = ($a == $b) ? "равны" : "не равны";
        echo "1. a == b: $result1<br>\n";

        $result2 = ($a > $b) ? "a больше b" : "a не больше b";
        echo "2. a > b: $result2<br>\n";

        $result3 = ($a < $b) ? "a меньше b" : "a не меньше b";
        echo "3. a < b: $result3<br>\n";

        $result4 = ($a === $b) ? "строго равны" : "не строго равны";
        echo "4. a === b: $result4<br>\n";

        echo "<br>изменяем значения: a = 20, b = 20 <br>\n";
        $a = 20;
        $b = 20;

        $result5 = ($a == $b) ? "равны" : "не равны";
        echo "5. a == b: $result5<br>\n";

        $result6 = ($a === $b) ? "строго равны" : "не строго равны";
        echo "6. a === b: $result6<br>\n";

        echo "<br>исследование с разными типами: a = 20 (число), b = '20' (строка)<br>\n";
        $a = 20;
        $b = "20";

        $result7 = ($a == $b) ? "нестрогое сравнение: равны" : "нестрогое сравнение: не равны";
        echo "7. $result7<br>\n";

        $result8 = ($a === $b) ? "строгое сравнение: равны" : "строгое сравнение: не равны";
        echo "8. $result8<br>\n";
    ?>

    <h3>2-1 задание</h3>
    <?php
        $age = 25;  //можно написать другой возраст
        echo "Вам: $age лет<br>\nВы ";

        if ($age >= 1 && $age <= 17) {
            echo "Слишком молод";
        } elseif ($age >= 18 && $age <= 35) {
            echo "Счастливчик";
        } else {
            echo "Не повезло";
        }
    ?>

    <h3>2-2 задание</h3>
    <?php
        $mass = [];
        for ($i = 1; $i <= 100; $i++) {
            if ($i % 2 == 0) {
                $mass[] = $i;
            }
        }
        foreach ($mass as $number) {
            if ($number % 5 == 0) {
                echo $number . " ";
            }
        }
    ?>

    <h3>2-3 задание</h3>
    <?php
        $mass2 = [
            "Name" => "Аполлинария<br>\n",
            "Address" => "ул. Ленина, д. 28, кв. 40<br>\n",
            "Phone" => "+7 (999) 123-45-67<br>\n",
            "Mail" => "meow@example.com"
        ];
        
        foreach ($mass2 as $element => $znach) {
            echo "$element: $znach\n";
        }
    ?>

<h3>3-1 задание</h3>
    <?php
        $str = "php";
        echo("вывод до функции: $str<br>\n"); 
        $str2 = strtoupper($str);
        echo ("вывод после функции: $str2");
    ?>

    
<h3>3-2 задание</h3>
    <?php
        $str = "london";
        echo("вывод до функции: $str<br>\n"); 
        $str2 = ucfirst($str);
        echo ("вывод после функции: $str2");
    ?>

    
<h3>3-3 задание</h3>
    <?php
        $str = "London";
        echo("вывод до функции: $str<br>\n"); 
        $str2 = lcfirst($str);
        echo ("вывод после функции: $str2<br>\n");
        $str3 = strtolower($str);
        echo ("с помощью другой функции: $str3");
    ?>

    
<h3>3-4 задание</h3>
    <?php
        $str = "html css php";
        $str_len = strlen($str);
        echo ("длина строки $str: $str_len");
    ?>

    
<h3>3-5 задание</h3>
    <?php
        $password = 'mypass123'; //можно ввести другой пароль
        if (strlen($password) > 5 && strlen($password) < 10) {
            echo "пароль подходит\n";
        } else {
            echo "нужно придумать другой пароль\n";
        }
    ?>

    
<h3>3-6 задание</h3>
    <?php
        $str = 'meow.png';//можно ввести другое
        echo("строка: $str<br>\n");
        if (substr($str, -4) == '.png') {
            echo "да\n";
        } else {
            echo "нет\n";
        }
    ?>

<h3>3-7 задание</h3>
    <?php
        $str  = "31.12.2013";
        echo("строка до функции: $str<br>\n");
        $str2 = strtr($str, ["."=> "-"]);
        echo("строка после функции: $str2");
    ?>

<h3>3-8 задание</h3>
    <?php
        $str  = "abcbcbcabbb";
        echo("строка до функции: $str<br>\n");
        $str2 = strtr($str, ["a"=> "1", "b"=> "2", "c"=> "3"]);
        echo("строка после функции: $str2");
    ?>

<h3>3-9 задание</h3>
    <?php
        $str = '1a2b3c4b5d6e7f8g9h0';
        echo ("строка до функции: $str<br>\n");
        $result = str_replace(range(0, 9), '', $str); //мб так
        echo ("строка после функции: $result");
    ?>

<h3>3-10 задание</h3>
    <?php
        $str = 'abc abc abc';
        $result = strpos($str, 'b');
        echo "позиция первой буквы 'b': $result\n";
    ?>

<h3>3-11 задание</h3>
    <?php
        $str = 'abc abc abc';
        $result = strrpos($str, 'b');
        echo "позиция последней буквы 'b': $result\n";
    ?>
<h3>3-11 задание</h3>
    </body>
</html>
